import { parsePhoneNumber } from "libphonenumber-js/min";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { addonsService } from "@/lib/addons-service";
import { hasMarketingConsent } from "@/lib/consent-server";
import { discountService } from "@/lib/discount-service";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import { getPackagePricing, matchActiveSurcharge } from "@/lib/pricing";
import { promoService } from "@/lib/promo-service";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import {
  sendAdminBookingNotification,
  sendBookingConfirmation,
} from "@/lib/resend";
import { settingsService } from "@/lib/settings-service";
import { supabaseAdmin } from "@/lib/supabase";
import { bookingSchema, type PackageId } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting
    const ip = getClientIP(request);

    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // Max 10 requests per minute
    });

    if (!rateLimitResult.success) {
      logError(new Error("Rate limit exceeded"), {
        ip,
        endpoint: "booking-confirmed",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();
    const {
      paymentId,
      conversationId,
      locale,
      promoCode,

      ...bookingData
    } = body;

    // Extract URL origin/referer for Facebook Match Rate
    const origin = request.headers.get("origin") || "";
    const eventSourceUrl = request.headers.get("referer") || origin;

    // Validate the request body (exclude paymentId fields from validation)
    const validationResult = bookingSchema.safeParse(bookingData);
    if (!validationResult.success) {
      const validationError = new ValidationError("Invalid request data");
      logError(validationError, {
        ip,
        endpoint: "booking-confirmed",
        validationIssues: validationResult.error.issues,
      });

      return NextResponse.json(
        {
          error: sanitizeErrorForProduction(validationError),
          details:
            process.env.NODE_ENV === "development"
              ? validationResult.error.issues
              : undefined,
        },
        { status: 400 },
      );
    }

    // Validate payment information
    if (!paymentId || !conversationId) {
      const paymentError = new ValidationError("Payment information required");
      logError(paymentError, {
        ip,
        endpoint: "booking-confirmed",
        action: "payment_validation",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(paymentError) },
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
      peopleCount,
    } = validationResult.data;

    // Fetch authoritative package details, time surcharges, active discounts, and promo code on the server
    const [
      { data: packageData },
      { data: timeSurcharges },
      activeDiscounts,
      validatedPromo,
    ] = await Promise.all([
      supabaseAdmin
        .from("packages")
        .select("price, is_per_person, title")
        .eq("slug", packageId)
        .single(),
      supabaseAdmin
        .from("time_surcharges")
        .select("*")
        .order("time", { ascending: true }),
      discountService.getActiveDiscounts(),
      promoService.validate(promoCode || body.appliedPromo?.code || ""),
    ]);

    const serverBasePrice = packageData
      ? Number(packageData.price)
      : Number(body.basePrice) || totalAmount || 0;
    const serverIsPerPerson = packageData
      ? Boolean(packageData.is_per_person)
      : Boolean(body.isPerPerson);

    const activeSurcharge = matchActiveSurcharge(
      bookingTime,
      timeSurcharges || [],
    );
    const surchargePercentage = activeSurcharge
      ? activeSurcharge.surcharge_percentage
      : 0;

    // Resolve addon details early — used for pricing calculation, DB save AND email
    const selectedAddonIds: string[] = body.selectedAddons || [];
    const addonQuantities: Record<string, number> = body.addonQuantities || {};
    let allAddons: any[] = [];
    let addonDetails: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }> = [];
    if (selectedAddonIds.length > 0) {
      try {
        allAddons = await addonsService.getAllAddonsAdmin();
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
            quantity: a.is_per_person ? addonQuantities[a.id] || 1 : 1,
          }));
      } catch (addonErr) {
        console.error("Failed to resolve addon details:", addonErr);
      }
    }

    // Validate that the totalAmount matches the authoritative server-calculated price
    const packagePricing = getPackagePricing(
      packageId as PackageId,
      serverBasePrice,
      activeDiscounts || body.activeDiscount || null,
      validatedPromo
        ? {
            code: validatedPromo.code,
            percentage: validatedPromo.discount_percentage,
          }
        : null,
      bookingDate,
      peopleCount,
      undefined,
      undefined,
      surchargePercentage,
      1.0,
      allAddons,
      selectedAddonIds,
      serverIsPerPerson,
      addonQuantities,
    );

    const expectedTotal = packagePricing.totalPrice;
    // We also need deposit amount for payment record
    const depositAmount = packagePricing.depositAmount;
    const remainingAmount = packagePricing.remainingAmount;

    if (Math.abs(totalAmount - expectedTotal) > 0.01) {
      const amountError = new ValidationError("Booking amount mismatch");
      logError(amountError, {
        ip,
        endpoint: "booking-confirmed",
        receivedAmount: totalAmount,
        expectedAmount: expectedTotal,
        bookingDate,
        promoCode,
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(amountError) },
        { status: 400 },
      );
    }

    try {
      // 1. Create or retrieve Supabase Auth User
      let authUserId = null;
      try {
        const baseUrl =
          request.headers.get("origin") ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          "https://istanbulportrait.com";
        const { data: authData, error: authError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(customerEmail, {
            data: { name: customerName, phone: customerPhone },
            redirectTo: `${baseUrl}/api/auth/confirm?next=/${locale || "en"}/account/update-password`,
          });

        if (authError) {
          console.log(
            "Auth invite error (user might exist):",
            authError.message,
          );
        } else if (authData.user) {
          authUserId = authData.user.id;
        }
      } catch (err) {
        console.error("Failed to provision auth user:", err);
      }

      // 2. Create Google Drive Folder
      let driveFolderId = null;
      try {
        const { createDriveFolder } = await import("@/lib/google-drive");
        const formattedDate = new Date(bookingDate)
          .toLocaleDateString("tr-TR")
          .replace(/\./g, "-");
        const folderName = `${customerName} - ${formattedDate}`;

        // You can pass a parentFolderId as a second argument if you have a "Customers" root folder
        const folder = await createDriveFolder(
          folderName,
          "1rKj5qIUzm8nTZ-hm7hspZaWupsKkiOCS",
        );
        if (folder?.id) {
          driveFolderId = folder.id;
        }
      } catch (err) {
        console.error("Failed to create Google Drive folder:", err);
      }

      // First create/update customer record
      const customerUpsertData: Record<string, any> = {
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
      };

      // We need to fetch the existing customer if we failed to get authUserId
      if (!authUserId) {
        const { data: existingCustomer } = await supabaseAdmin
          .from("customers")
          .select("user_id")
          .eq("email", customerEmail)
          .single();
        if (existingCustomer?.user_id) {
          authUserId = existingCustomer.user_id;
        }
      }

      if (authUserId) {
        customerUpsertData.user_id = authUserId;
      }

      const { error: customerError } = await supabaseAdmin
        .from("customers")
        .upsert(customerUpsertData, { onConflict: "email" })
        .select()
        .single();

      if (customerError) {
        logError(handleSupabaseError(customerError), {
          ip,
          endpoint: "booking-confirmed",
          action: "customer_upsert",
        });
        // Continue even if customer upsert fails for demo mode compatibility
      }

      let booking;
      const { bookingId } = body;
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
        // Fallback
      }

      const resolvedPromoCode =
        validatedPromo?.code || body.appliedPromo?.code || promoCode || null;

      if (bookingId) {
        // Update existing draft booking while preserving existing gclid/gbraid/wbraid/ip_address if not present in current request
        const updatePayload: Record<string, any> = {
          package_id: packageId,
          status: "confirmed",
          total_amount: totalAmount,
          notes: notes || null,
          locale: locale || "en",
          applied_promo_code: resolvedPromoCode,
          // Update other fields in case they changed during checkout
          user_name: customerName,
          user_email: customerEmail,
          user_phone: customerPhone,
          booking_date: bookingDate,
          booking_time: bookingTime,
          people_count: peopleCount || null,
          user_id: authUserId || null,
          drive_folder_id: driveFolderId || null,
          selected_addons: selectedAddonIds,
          selected_addon_details: addonDetails,
          country_code: countryCode,
          updated_at: new Date().toISOString(),
        };
        if (ip) updatePayload.ip_address = ip;
        if (gclid) updatePayload.gclid = gclid;
        if (gbraid) updatePayload.gbraid = gbraid;
        if (wbraid) updatePayload.wbraid = wbraid;

        const { data: existingBooking, error: updateError } =
          await supabaseAdmin
            .from("bookings")
            .update(updatePayload)
            .eq("id", bookingId)
            .eq("status", "draft")
            .select()
            .maybeSingle();

        if (updateError) {
          throw updateError;
        }
        booking = existingBooking;
      }

      if (!booking) {
        // Create confirmed booking in Supabase (fallback)
        const bookingInsertData: Record<string, any> = {
          package_id: packageId,
          user_name: customerName,
          user_email: customerEmail,
          user_phone: customerPhone,
          booking_date: bookingDate,
          booking_time: bookingTime,
          status: "confirmed",
          total_amount: totalAmount,
          notes: notes || null,
          locale: locale || "en",
          applied_promo_code: resolvedPromoCode,
          people_count: peopleCount || null,
          user_id: authUserId || null,
          drive_folder_id: driveFolderId || null,

          ip_address: ip || null,
          selected_addons: selectedAddonIds,
          selected_addon_details: addonDetails,
          gclid: gclid,
          gbraid: gbraid,
          wbraid: wbraid,
          country_code: countryCode,
        };

        const { data: newBooking, error: insertError } = await supabaseAdmin
          .from("bookings")
          .insert(bookingInsertData)
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        booking = newBooking;
      }

      if (validatedPromo?.code) {
        await promoService.incrementUsage(validatedPromo.code);
      }

      // Extract tracking & EMQ parameters for Meta CAPI & GA4 attribution
      const fbc = body.fbc || request.cookies.get("_fbc")?.value;
      const fbp = body.fbp || request.cookies.get("_fbp")?.value;
      const clientUserAgent = request.headers.get("user-agent") || undefined;
      const clientIpAddress = ip; // Already extracted via getClientIP at the top

      const { extractClientIdFromCookie } = await import("@/lib/ga4-server");
      const rawGaCookie = request.cookies.get("_ga")?.value;
      const gaClientId = extractClientIdFromCookie(rawGaCookie);

      let gaSessionId: string | undefined;
      const measurementIdCookie = request.cookies
        .getAll()
        .find((c) => c.name.startsWith("_ga_"))?.value;
      if (measurementIdCookie) {
        // GS1: GS1.1.<session_id>.<n>...   GS2: GS2.1.s<session_id>$o1$g1...
        const raw = measurementIdCookie.split(".")[2] || "";
        const match = raw.match(/^s?(\d+)/);
        if (match) {
          gaSessionId = match[1];
        }
      }

      const trackingMetadata = {
        ...(body.providerResponse && typeof body.providerResponse === "object"
          ? body.providerResponse
          : {}),
        ...(gaClientId ? { ga_client_id: gaClientId } : {}),
        ...(gaSessionId ? { ga_session_id: gaSessionId } : {}),
        ...(fbc ? { fbc } : {}),
        ...(fbp ? { fbp } : {}),
        ...(body.externalId ? { external_id: body.externalId } : {}),
      };

      // Record payment in database (linking to booking)
      const { error: paymentInsertError } = await supabaseAdmin
        .from("payments")
        .insert({
          booking_id: booking.id,
          payment_id: paymentId,
          conversation_id: conversationId,
          status: "success",
          amount: body.provider === "cash" ? 0 : depositAmount, // Record 0 for cash, otherwise DEPOSIT
          currency: "EUR",
          provider: body.provider || "iyzico",
          provider_response: trackingMetadata, // Save the raw response + tracking attribution
          provider_order_id:
            body.provider === "turinvoice" ? paymentId : undefined,
        });

      if (paymentInsertError) {
        console.error("Payment insert error:", paymentInsertError);
        // Don't fail the booking creation if payment record fails
      }

      const _duration = Date.now() - startTime;

      // Send confirmation email
      try {
        // Use packagePricing for accurate breakdown
        const emailOriginalPrice = packagePricing.originalPrice;
        const emailSeasonalDiscount = packagePricing.discountAmount;
        const emailPromoDiscount = packagePricing.promoAmount;

        const settings = await settingsService.getSettings();
        // addonDetails already resolved above — reuse for email

        await sendBookingConfirmation(
          {
            customerName,
            customerEmail,
            customerPhone,
            packageName: `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`,
            bookingDate,
            bookingTime,
            totalAmount,
            originalAmount: emailOriginalPrice,
            discountAmount: emailSeasonalDiscount + (emailPromoDiscount || 0),
            bookingId: booking.id,
            peopleCount: peopleCount,
            depositAmount: body.provider === "cash" ? 0 : depositAmount,
            remainingAmount:
              body.provider === "cash" ? totalAmount : remainingAmount,
            locale: locale || "en",
            promoCode: promoCode || undefined,
            addonDetails,
          },
          settings,
        );

        // Also send notification to the admin
        await sendAdminBookingNotification(
          {
            customerName,
            customerEmail,
            customerPhone,
            packageName: `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`,
            bookingDate,
            bookingTime,
            totalAmount,
            originalAmount: emailOriginalPrice,
            discountAmount: emailSeasonalDiscount + (emailPromoDiscount || 0),
            bookingId: booking.id,
            peopleCount: peopleCount,
            depositAmount: body.provider === "cash" ? 0 : depositAmount,
            remainingAmount:
              body.provider === "cash" ? totalAmount : remainingAmount,
            locale: locale || "en",
            promoCode: promoCode || undefined,
            notes: notes || undefined,
            addonDetails,
          },
          settings,
        );
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
        // Don't fail the booking creation if email fails
      }

      // Track Facebook CAPI Purchase
      // We do this here because we now have a guaranteed Booking ID (Transaction ID)
      // and we are running server-side.
      const marketingConsent = hasMarketingConsent(request);

      const nameParts = customerName.split(" ");
      const firstName = nameParts[0];
      const lastName =
        nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

      try {
        const { trackFacebookPurchase } = await import("@/lib/facebook");
        if (marketingConsent)
          await trackFacebookPurchase(
            customerEmail,
            customerPhone,
            packageId,
            totalAmount,
            booking.id, // Transaction ID
            booking.id, // Deduplication Key (event_id forced to transaction_id)
            {
              eventSourceUrl,
              fbc,
              fbp,
              externalId: body.externalId,
              clientIpAddress,
              clientUserAgent,
              firstName,
              lastName,
              country: countryCode,
              yieldCategory: body.yieldReason,
              checkinDate: bookingDate,
            },
          );
      } catch (facebookError) {
        console.error("Facebook CAPI Error:", facebookError);
        // Non-blocking error
      }

      // ── Meta CRM Lead Event (auto-fires on every confirmed booking) ──
      try {
        const { trackMetaCRMLeadEvent } = await import("@/lib/facebook");
        if (marketingConsent)
          await trackMetaCRMLeadEvent(
            customerEmail,
            customerPhone,
            booking.id,
            body.eventId ? `crm_${body.eventId}` : undefined,
            {
              eventSourceUrl,
              fbc,
              fbp,
              externalId: body.externalId,
              clientIpAddress,
              clientUserAgent,
              firstName,
              lastName,
              country: countryCode,
            },
          );
      } catch (crmError) {
        console.error("Meta CRM Lead Event Error:", crmError);
        // Non-blocking error
      }

      // ── GA4 Measurement Protocol (Server-Side Purchase Fallback) ──
      // Only fire server-side purchase when the browser gtag.js client is blocked
      // or has no _ga cookie, preventing double-counting in GA4.
      const shouldSendServerGA4Purchase = !body.gaClientActive || !gaClientId;
      if (shouldSendServerGA4Purchase) {
        try {
          const { trackGA4ServerPurchase } = await import("@/lib/ga4-server");

          const localeKey = booking.locale || locale || "en";
          const packageName =
            packageData?.title?.[localeKey] ||
            packageData?.title?.en ||
            packageId;

          await trackGA4ServerPurchase(
            booking.id,
            packageId,
            packageName,
            totalAmount,
            "EUR",
            gaClientId,
            gaSessionId,
            marketingConsent,
            booking.user_id,
          );
        } catch (ga4Error) {
          console.error("GA4 Measurement Protocol Error:", ga4Error);
          // Non-blocking error
        }
      }

      // Add to Resend Audience (Newsletter/Marketing)
      // Non-blocking: we don't await this or we catch errors internally
      try {
        const nameParts = customerName.split(" ");
        const _firstName = nameParts[0];
        const _lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        // Execute in background
        // addContactToAudience(customerEmail, firstName, lastName);
      } catch (audienceError) {
        console.error("Audience sync error:", audienceError);
      }

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          packageId: booking.package_id,
          customerName: booking.user_name,
          customerEmail: booking.user_email,
          customerPhone: booking.user_phone,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          totalAmount: booking.total_amount,
          status: booking.status,
          paymentId,
          peopleCount: booking.people_count,
          // GA4 User-ID for the client (only with analytics consent)
          analyticsUserId: marketingConsent ? booking.user_id || null : null,
        },
      });
    } catch (supabaseError: unknown) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        ip,
        endpoint: "booking-confirmed",
        action: "database_operation",
      });

      return NextResponse.json(
        {
          error: sanitizeErrorForProduction(dbError),
          details:
            process.env.NODE_ENV === "development"
              ? handleSupabaseError(supabaseError).message
              : undefined,
        },
        { status: 503 },
      );
    }
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logError(error, {
      endpoint: "booking-confirmed",
      duration,
      action: "unexpected_error",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}
