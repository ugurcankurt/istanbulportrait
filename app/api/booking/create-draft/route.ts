import { parsePhoneNumber } from "libphonenumber-js/min";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { addonsService } from "@/lib/addons-service";
import { getServerUser, isServerAdmin } from "@/lib/auth-server";
import { signBookingToken, verifyBookingToken } from "@/lib/booking-token";
import { handleSupabaseError, logError } from "@/lib/errors";
import { extractPhotosCount } from "@/lib/features-parser";
import { packagesService } from "@/lib/packages-service";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { settingsService } from "@/lib/settings-service";
import { supabaseAdmin } from "@/lib/supabase";
import { baseBookingSchema } from "@/lib/validations";

// Extended schema to include locale
const draftSchema = baseBookingSchema
  .extend({
    locale: z.string().default("en"),
  })
  .refine(
    (_data) => {
      // Removed hardcoded "rooftop" check. Schema handles basic validation.
      return true;
    },
    {
      message: "validation.people_count_required",
      path: ["peopleCount"],
    },
  );

/**
 * Retrieve a draft booking by ID for checkout hydration (cross-device / abandoned cart recovery)
 */
export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const rateLimit = await checkRateLimit(`booking-draft-get:${clientIP}`, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });

    if (!rateLimit.success) {
      return createRateLimitError(rateLimit.resetTime);
    }

    const bookingId = request.nextUrl.searchParams.get("bookingId");
    const tokenParam = request.nextUrl.searchParams.get("token");
    const localeParam = request.nextUrl.searchParams.get("locale");

    const idValidation = z.string().uuid().safeParse(bookingId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 },
      );
    }

    const cookieToken = request.cookies.get(
      `booking_draft_${idValidation.data}`,
    )?.value;
    const hasValidToken =
      verifyBookingToken(idValidation.data, "draft", tokenParam) ||
      verifyBookingToken(idValidation.data, "draft", cookieToken);

    const serverUser = hasValidToken ? null : await getServerUser();
    if (!hasValidToken && !serverUser) {
      return NextResponse.json(
        { error: "Unauthorized access to draft booking" },
        { status: 401 },
      );
    }

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select(
        "id, package_id, user_id, user_name, user_email, user_phone, booking_date, booking_time, status, total_amount, notes, locale, people_count, selected_addons, selected_addon_details, applied_promo_code, created_at",
      )
      .eq("id", idValidation.data)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: "Draft booking not found" },
        { status: 404 },
      );
    }

    if (!hasValidToken && serverUser) {
      const ownsBooking =
        booking.user_id === serverUser.id ||
        (serverUser.email &&
          booking.user_email?.toLowerCase() === serverUser.email.toLowerCase());
      const adminUser = ownsBooking
        ? false
        : await isServerAdmin(serverUser.email);
      if (!ownsBooking && !adminUser) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (booking.status !== "draft") {
      return NextResponse.json(
        {
          error: "Booking is no longer a draft",
          status: booking.status,
        },
        { status: 409 },
      );
    }

    const effectiveLocale = localeParam || booking.locale || "en";
    const pkg = await packagesService.getPackageBySlug(booking.package_id);

    const titleMap = pkg?.title as Record<string, string> | undefined;
    const packageDisplayName =
      titleMap?.[effectiveLocale] || titleMap?.en || booking.package_id;

    const durationMap = pkg?.duration as Record<string, string> | undefined;
    const packageDuration =
      durationMap?.[effectiveLocale] || durationMap?.en || "";

    const featuresMap = pkg?.features as Record<string, string[]> | undefined;
    const packageFeatures =
      featuresMap?.[effectiveLocale] || featuresMap?.en || [];

    const selectedAddons: string[] = Array.isArray(booking.selected_addons)
      ? booking.selected_addons
      : [];
    const addonQuantities: Record<string, number> = {};

    if (Array.isArray(booking.selected_addon_details)) {
      for (const item of booking.selected_addon_details) {
        if (item && typeof item === "object" && "id" in item) {
          const id = String((item as { id: unknown }).id);
          const qty = Number((item as { quantity?: unknown }).quantity ?? 1);
          addonQuantities[id] = Number.isFinite(qty) && qty > 0 ? qty : 1;
        }
      }
    }

    for (const addonId of selectedAddons) {
      if (!(addonId in addonQuantities)) {
        addonQuantities[addonId] = 1;
      }
    }

    return NextResponse.json({
      success: true,
      bookingData: {
        bookingId: booking.id,
        packageId: booking.package_id,
        customerName: booking.user_name || "",
        customerEmail: booking.user_email || "",
        customerPhone: booking.user_phone || "",
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        notes: booking.notes || "",
        totalAmount: Number(booking.total_amount) || 0,
        basePrice: pkg?.price ?? (Number(booking.total_amount) || 0),
        originalPrice: pkg?.original_price ?? undefined,
        isPerPerson: Boolean(pkg?.is_per_person),
        peopleCount: booking.people_count ?? 1,
        selectedAddons,
        addonQuantities,
        appliedPromoCode: booking.applied_promo_code || undefined,
        packageDisplayName,
        packageDuration,
        packagePhotos: extractPhotosCount(packageFeatures),
        packageLocations: pkg?.locations ?? 1,
        packageFeatures,
        createdAt: booking.created_at,
      },
    });
  } catch (error) {
    logError(error, { action: "draft_get_unexpected" });
    return NextResponse.json(
      { error: "Failed to retrieve draft booking" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const _startTime = Date.now();

  try {
    const ip = getClientIP(request);

    // Light rate limiting for drafts
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimitResult.success) {
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();
    const validationResult = draftSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const {
      packageId,
      customerName,
      customerEmail,
      customerPhone,
      bookingDate,
      bookingTime,
      notes,
      totalAmount,
      locale,
      peopleCount,
      selectedAddons,
    } = validationResult.data;

    const addonQuantitiesMap = (validationResult.data.addonQuantities ||
      {}) as Record<string, number>;
    try {
      // 1. Upsert Customer
      const { error: customerError } = await supabaseAdmin
        .from("customers")
        .upsert(
          {
            email: customerEmail,
            name: customerName,
            phone: customerPhone,
          },
          { onConflict: "email" },
        )
        .select()
        .single();

      if (customerError) {
        logError(handleSupabaseError(customerError), {
          action: "draft_customer_upsert",
        });
        // Proceed anyway
      }

      // 2. Create Draft Booking
      const selectedAddonIds: string[] = selectedAddons || [];
      let addonDetails: Array<{ id: string; name: string; price: number }> = [];
      if (selectedAddonIds.length > 0) {
        try {
          const allAddons = await addonsService.getAllAddonsAdmin();
          addonDetails = selectedAddonIds
            .map((id) => allAddons.find((a) => a.id === id))
            .filter((a): a is NonNullable<typeof a> => Boolean(a))
            .map((a) => ({
              id: a.id,
              name:
                a.title[locale || "en"] ||
                a.title.en ||
                Object.values(a.title)[0] ||
                a.slug,
              price: a.price,
              quantity: a.is_per_person ? addonQuantitiesMap[a.id] || 1 : 1,
            }));
        } catch (addonErr) {
          console.error("Failed to resolve addon details for draft:", addonErr);
        }
      }

      const gclid = request.cookies.get("gclid")?.value || null;
      const gbraid = request.cookies.get("gbraid")?.value || null;
      const wbraid = request.cookies.get("wbraid")?.value || null;

      let countryCode = "TR";
      try {
        const parsedPhone = parsePhoneNumber(customerPhone);
        if (parsedPhone && parsedPhone.country) {
          countryCode = parsedPhone.country;
        }
      } catch (e) {
        // Fallback to 'TR'
      }

      const draftInsertData: Record<string, any> = {
        package_id: packageId,
        user_name: customerName,
        user_email: customerEmail,
        user_phone: customerPhone,
        booking_date: bookingDate,
        booking_time: bookingTime,
        status: "draft", // IMPORTANT: Draft status
        total_amount: totalAmount,
        notes: notes || null,
        locale: locale, // Save language preference
        abandoned_email_sent: false,
        people_count: peopleCount || null,
        selected_addons: selectedAddons || [],
        selected_addon_details: addonDetails,

        ip_address: ip || null,
        gclid: gclid,
        gbraid: gbraid,
        wbraid: wbraid,
        country_code: countryCode,
      };

      const { data: booking, error } = await supabaseAdmin
        .from("bookings")
        .insert(draftInsertData)
        .select()
        .single();

      if (error) throw error;

      // 3. Add to Resend Audience/Contacts if enabled
      try {
        const settings = await settingsService.getSettings();
        const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY;
        const audienceId =
          settings.resend_audience_id || process.env.RESEND_AUDIENCE_ID;

        console.log("Resend Execution Check:", {
          hasApiKey: !!apiKey && apiKey !== "demo-resend-key",
          hasAudienceId: !!audienceId,
        });

        if (apiKey && apiKey !== "demo-resend-key") {
          const resend = new Resend(apiKey);
          const nameParts = customerName.split(" ");
          const firstName = nameParts[0];
          const lastName =
            nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

          if (audienceId) {
            // Native SDK approach as strictly specified in v6+
            resend.contacts
              .create({
                audienceId: audienceId,
                email: customerEmail,
                firstName: firstName,
                lastName: lastName,
                unsubscribed: false,
              })
              .then(({ data, error }) => {
                if (error) console.error("Resend Contacts SDK Error:", error);
                else console.log("Resend Contact Added:", data);
              })
              .catch((err) => {
                console.error("Resend Contacts SDK Exception:", err);
              });
          } else {
            console.warn(
              "WARNING: Resend Contact creation skipped. No audienceId provided. Add RESEND_AUDIENCE_ID to Vercel or Settings.",
            );
          }
        } else {
          console.warn(
            "WARNING: Resend Contact creation skipped. API Key is missing or default.",
          );
        }
      } catch (contactError) {
        // Silently fail setting the contact so we don't break booking flow
        console.error(
          "Failed to add contact to Resend Audience:",
          contactError,
        );
      }

      const draftBookingId = (booking as any).id as string;
      const draftToken = signBookingToken(draftBookingId, "draft");
      const res = NextResponse.json({
        success: true,
        bookingId: draftBookingId,
        token: draftToken,
      });
      res.cookies.set(`booking_draft_${draftBookingId}`, draftToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
      return res;
    } catch (dbError) {
      logError(handleSupabaseError(dbError), { action: "create_draft" });
      return NextResponse.json(
        { error: "Database error creating draft" },
        { status: 500 },
      );
    }
  } catch (error) {
    logError(error, { action: "draft_unexpected" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
