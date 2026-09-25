import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { addonsService } from "@/lib/addons-service";
import { handleSupabaseError, logError } from "@/lib/errors";
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
      };

      let { data: booking, error } = await supabaseAdmin
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

      return NextResponse.json({
        success: true,
        bookingId: (booking as any).id,
      });
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
