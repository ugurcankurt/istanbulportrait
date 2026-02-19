import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { sendBookingConfirmation, addContactToAudience } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase";
import { bookingSchema, packagePrices, PackageId } from "@/lib/validations";
import { calculateDiscountedPrice, getPackagePricing } from "@/lib/pricing";

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
    const { paymentId, conversationId, ...bookingData } = body;

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

    // Validate that the totalAmount matches the expected price
    const basePrice = packagePrices[packageId as keyof typeof packagePrices];
    let expectedPrice: number = basePrice;

    // We check against the booking date for seasonal discounts
    const packagePricing = getPackagePricing(
      packageId as PackageId,
      undefined,
      bookingDate,
      peopleCount
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
        bookingDate
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
        .upsert({
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
        }, { onConflict: "email" })
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
        const { data: existingBooking, error: updateError } = await supabaseAdmin
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
            package_id: packageId,
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
        // Calculate discount details for email
        const { originalPrice, discountAmount } = calculateDiscountedPrice(
          packagePrices[packageId as keyof typeof packagePrices],
          bookingDate,
        );

        let emailOriginalPrice = originalPrice;
        let emailDiscountAmount = discountAmount;

        if (packageId === "rooftop" && peopleCount && peopleCount > 1) {
          emailOriginalPrice = originalPrice * peopleCount;
          emailDiscountAmount = discountAmount * peopleCount;
        }

        await sendBookingConfirmation({
          customerName,
          customerEmail,
          packageName: `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`,
          bookingDate,
          bookingTime,
          totalAmount,
          originalAmount: emailOriginalPrice,
          discountAmount: emailDiscountAmount,
          bookingId: booking.id,
          peopleCount: peopleCount,
          depositAmount,
          remainingAmount,
          // content below will use these to display breakdown
        });

        // Track Facebook CAPI Purchase
        // We do this here because we now have a guaranteed Booking ID (Transaction ID)
        // and we are running server-side.
        if (body.eventId) {
          try {
            const { trackFacebookPurchase } = await import("@/lib/facebook");
            await trackFacebookPurchase(
              customerEmail,
              customerPhone,
              packageId,
              totalAmount,
              booking.id, // Transaction ID
              body.eventId, // Deduplication Key
            );
          } catch (facebookError) {
            console.error("Facebook CAPI Error:", facebookError);
            // Non-blocking error
          }
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
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        // Execute in background
        addContactToAudience(customerEmail, firstName, lastName);
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
