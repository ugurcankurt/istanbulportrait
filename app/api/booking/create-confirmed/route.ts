import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import { getPackagePricing } from "@/lib/pricing";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { sendBookingConfirmation, sendAdminBookingNotification } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase";
import {
  bookingSchema,
  type PackageId,
} from "@/lib/validations";
import { packagesService } from "@/lib/packages-service";
import { discountService, type DiscountDB } from "@/lib/discount-service";
import { settingsService } from "@/lib/settings-service";

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
    const { locale, provider = "cash", ...bookingData } = body;

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

    const packageObj = await packagesService.getPackageBySlug(packageId as string);
    if (!packageObj) {
      const packageError = new ValidationError("Package not found");
      return NextResponse.json(
        { error: sanitizeErrorForProduction(packageError) },
        { status: 400 },
      );
    }

    // Fetch active discount for verification
    const activeDiscount = await discountService.getActiveDiscount();

    // Validate that the totalAmount matches the expected price
    // We check against the active system discount for correct total
    const packagePricing = getPackagePricing(
      packageId as string,
      Number(packageObj.price),
      activeDiscount,
      bookingDate,
      peopleCount,
      undefined, // use TR default taxRate
      packageObj.title[locale] || packageObj.title["en"] || packageObj.slug
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
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(amountError) },
        { status: 400 },
      );
    }

    try {
      // First create/update customer record
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
              // Update other fields in case they changed during checkout
              user_name: customerName,
              user_phone: customerPhone,
              booking_date: bookingDate,
              booking_time: bookingTime,
              people_count: packageId === "rooftop" ? peopleCount : null, // Only for rooftop
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
            package_id: packageObj.id,
            user_name: customerName,
            user_email: customerEmail,
            user_phone: customerPhone,
            booking_date: bookingDate,
            booking_time: bookingTime,
            status: "confirmed", // Directly confirmed since payment succeeded
            total_amount: totalAmount,
            notes: notes || null,
            people_count: packageId === "rooftop" ? peopleCount : null, // Only for rooftop
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
          payment_id: `cash_${booking.id}`,
          conversation_id: `cash_${Date.now()}`,
          status: "pending", // Cash is paid on the day
          amount: totalAmount, // Record the total amount to be paid
          currency: "EUR",
          provider: "cash",
          provider_response: { method: "cash_on_date" },
        });

      if (paymentInsertError) {
        console.error("Payment insert error:", paymentInsertError);
        // Don't fail the booking creation if payment record fails
      }

      const _duration = Date.now() - startTime;

      // Send confirmation email
      try {
        const settings = await settingsService.getSettings();
        const emailOriginalPrice = packagePricing.originalPrice;
        const emailSeasonalDiscount = packagePricing.discountAmount;
        
        const bookingData = {
          customerName,
          customerEmail,
          customerPhone,
          packageName: `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`,
          bookingDate,
          bookingTime,
          totalAmount,
          originalAmount: emailOriginalPrice,
          discountAmount: emailSeasonalDiscount,
          bookingId: booking.id,
          peopleCount: peopleCount,
          depositAmount,
          remainingAmount,
          locale: locale || "en",
          notes,
        };

        // Send to Customer
        await sendBookingConfirmation(bookingData, settings);
        
        // Send Notification to System Admin
        await sendAdminBookingNotification(bookingData, settings);

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

          // ── GA4 Measurement Protocol (server-side, 100% reliable) ──
          try {
            const {
              trackGA4ServerPurchase,
              extractClientIdFromCookie,
            } = await import("@/lib/ga4-server");

            // Extract _ga cookie from the request
            const gaCookie = request.cookies.get("_ga")?.value;
            const clientId = extractClientIdFromCookie(gaCookie);

            await trackGA4ServerPurchase(
              booking.id,
              packageId,
              packageObj.title["en"] || packageId, // use dynamic package name
              totalAmount,
              "EUR",
              clientId,
            );
          } catch (ga4Error) {
            console.error("GA4 Measurement Protocol Error:", ga4Error);
            // Non-blocking error
          }
        }
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
        // Don't fail the booking creation if email fails
      }

      // Newsletter logic removed intentionally to eliminate spam/marketing.

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
