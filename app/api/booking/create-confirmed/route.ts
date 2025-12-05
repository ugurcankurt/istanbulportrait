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
import { sendBookingConfirmation } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase";
import { bookingSchema } from "@/lib/validations";

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
    } = validationResult.data;

    try {
      // First create/update customer record
      const { error: customerError } = await supabaseAdmin
        .from("customers")
        .upsert({
          email: customerEmail,
          name: customerName,
          phone: customerPhone,
        })
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

      // Create confirmed booking in Supabase (payment already successful)
      const { data: booking, error } = await supabaseAdmin
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
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Record payment in database (linking to booking)
      const { error: paymentInsertError } = await supabaseAdmin
        .from("payments")
        .insert({
          booking_id: booking.id,
          payment_id: paymentId,
          conversation_id: conversationId,
          status: "success",
          amount: totalAmount,
          currency: "EUR",
          provider: body.provider || "iyzico",
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
        await sendBookingConfirmation({
          customerName,
          customerEmail,
          packageName: `${packageId.charAt(0).toUpperCase() + packageId.slice(1)} Package`,
          bookingDate,
          bookingTime,
          totalAmount,
          bookingId: booking.id,
        });
      } catch (emailError) {
        console.error("❌ Failed to send confirmation email:", emailError);
        // Don't fail the booking creation if email fails
      }

      return NextResponse.json({
        success: true,
        booking: {
          id: booking.id,
          packageId: booking.package_id,
          customerName: booking.user_name,
          customerEmail: booking.user_email,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          totalAmount: booking.total_amount,
          status: booking.status,
          paymentId,
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
