import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import { getPackagePricing, matchActiveSurcharge } from "@/lib/pricing";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { sendBookingConfirmation } from "@/lib/resend";
import { settingsService } from "@/lib/settings-service";
import { supabaseAdmin } from "@/lib/supabase";
import {
  bookingSchema,
  type PackageId,

} from "@/lib/validations";

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
    const { paymentId, conversationId, locale, promoCode, ...bookingData } = body;

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

    // Fetch time surcharges for accurate calculation
    const { data: timeSurcharges } = await supabaseAdmin
      .from("time_surcharges")
      .select("*")
      .order("time", { ascending: true });

    const activeSurcharge = matchActiveSurcharge(bookingTime, timeSurcharges || []);
    const surchargePercentage = activeSurcharge ? activeSurcharge.surcharge_percentage : 0;

    // Validate that the totalAmount matches the expected price
    // We check against the booking date and promo code for correct discounts
    const packagePricing = getPackagePricing(
      packageId as PackageId,
      body.basePrice || totalAmount || 0,
      body.activeDiscount || null,
      body.appliedPromo,
      bookingDate,
      body.isPerPerson ? peopleCount : undefined,
      undefined,
      undefined,
      surchargePercentage
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
        const baseUrl = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "https://istanbulportrait.com";
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(customerEmail, {
          data: { name: customerName, phone: customerPhone },
          redirectTo: `${baseUrl}/api/auth/confirm?next=/${locale || "en"}/account/update-password`
        });
        
        if (authError) {
          console.log("Auth invite error (user might exist):", authError.message);
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
        const formattedDate = new Date(bookingDate).toLocaleDateString('tr-TR').replace(/\./g, '-'); 
        const folderName = `${customerName} - ${formattedDate}`;
        
        // You can pass a parentFolderId as a second argument if you have a "Customers" root folder
        const folder = await createDriveFolder(folderName, "1rKj5qIUzm8nTZ-hm7hspZaWupsKkiOCS");
        if (folder && folder.id) {
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
        const { data: existingCustomer } = await supabaseAdmin.from("customers").select("user_id").eq("email", customerEmail).single();
        if (existingCustomer?.user_id) {
          authUserId = existingCustomer.user_id;
        }
      }
      
      if (authUserId) {
        customerUpsertData.user_id = authUserId;
      }

      const { error: customerError } = await supabaseAdmin
        .from("customers")
        .upsert(
          customerUpsertData,
          { onConflict: "email" },
        )
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

      if (bookingId) {
        // Update existing draft booking
        const { data: existingBooking, error: updateError } =
          await supabaseAdmin
            .from("bookings")
            .update({
              status: "confirmed",
              total_amount: totalAmount,
              notes: notes || null,
              applied_promo_code: body.appliedPromo?.code || promoCode || null,
              // Update other fields in case they changed during checkout
              user_name: customerName,
              user_phone: customerPhone,
              booking_date: bookingDate,
              booking_time: bookingTime,
              people_count: peopleCount || null,
              user_id: authUserId || null,
              drive_folder_id: driveFolderId || null,
            })
            .eq("id", bookingId)
            .select()
            .single();

        if (updateError) {
          throw updateError;
        }
        booking = existingBooking;
      } else {
        // Create confirmed booking in Supabase (fallback)
        const { data: newBooking, error: insertError } = await supabaseAdmin
          .from("bookings")
          .insert({
            package_id: packageId,
            user_name: customerName,
            user_email: customerEmail,
            user_phone: customerPhone,
            booking_date: bookingDate,
            booking_time: bookingTime,
            status: "confirmed", // Directly confirmed since payment succeeded
            total_amount: totalAmount,
            notes: notes || null,
            applied_promo_code: body.appliedPromo?.code || promoCode || null,
            people_count: peopleCount || null,
            user_id: authUserId || null,
            drive_folder_id: driveFolderId || null,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        booking = newBooking;
      }

      // Record payment in database (linking to booking)
      const { error: paymentInsertError } = await supabaseAdmin
        .from("payments")
        .insert({
          booking_id: booking.id,
          payment_id: paymentId,
          conversation_id: conversationId,
          status: "success",
          amount: depositAmount, // Record the DEPOSIT amount, not total
          currency: "EUR",
          provider: body.provider || "iyzico",
          provider_response: body.providerResponse || {}, // Save the raw response
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

        await sendBookingConfirmation({
          customerName,
          customerEmail,
          customerPhone,
          packageName: `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`,
          bookingDate,
          bookingTime,
          totalAmount,
          originalAmount: emailOriginalPrice,
          discountAmount: emailSeasonalDiscount + (emailPromoDiscount || 0), // Total discount for now, can be split if template supports it
          bookingId: booking.id,
          peopleCount: peopleCount,
          depositAmount,
          remainingAmount,
          locale: locale || "en",
          // Add extra details if needed
          promoCode: promoCode || undefined,
        }, settings);

        // Track Facebook CAPI Purchase
        // We do this here because we now have a guaranteed Booking ID (Transaction ID)
        // and we are running server-side.
        if (body.eventId) {
          // Extract EMQ parameters for Meta CAPI
          const fbc = request.cookies.get("_fbc")?.value;
          const fbp = request.cookies.get("_fbp")?.value;
          const clientUserAgent = request.headers.get("user-agent") || undefined;
          const clientIpAddress = ip; // Already extracted via getClientIP at the top

          try {
            const { trackFacebookPurchase } = await import("@/lib/facebook");
            await trackFacebookPurchase(
              customerEmail,
              customerPhone,
              packageId,
              totalAmount,
              booking.id, // Transaction ID
              body.eventId, // Deduplication Key
              { eventSourceUrl, fbc, fbp, clientIpAddress, clientUserAgent },
            );
          } catch (facebookError) {
            console.error("Facebook CAPI Error:", facebookError);
            // Non-blocking error
          }

          // ── Meta CRM Lead Event (auto-fires on every confirmed booking) ──
          try {
            const { trackMetaCRMLeadEvent } = await import("@/lib/facebook");
            await trackMetaCRMLeadEvent(
              customerEmail,
              customerPhone,
              booking.id,
              body.eventId ? `crm_${body.eventId}` : undefined,
              { eventSourceUrl, fbc, fbp, clientIpAddress, clientUserAgent },
            );
          } catch (crmError) {
            console.error("Meta CRM Lead Event Error:", crmError);
            // Non-blocking error
          }

          // Server-side GA4 tracking removed to prevent duplicate "purchase" events since frontend already handles it perfectly.
        }
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
        // Don't fail the booking creation if email fails
      }

      // Add to Resend Audience (Newsletter/Marketing)
      // Non-blocking: we don't await this or we catch errors internally
      try {
        const nameParts = customerName.split(" ");
        const firstName = nameParts[0];
        const lastName =
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
