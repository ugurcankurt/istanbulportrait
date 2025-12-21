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
      logError(new Error("Rate limit exceeded"), { ip, endpoint: "booking" });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();

    // Validate the request body
    const validationResult = bookingSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = new ValidationError("Invalid request data");
      logError(validationError, {
        ip,
        endpoint: "booking",
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
    } = validationResult.data;

    try {
      // Check if package exists
      const { data: packageData, error: packageError } = await supabaseAdmin
        .from("packages")
        .select("id, price")
        .eq("id", packageId)
        .single();

      if (packageError) {
        logError(handleSupabaseError(packageError), {
          ip,
          endpoint: "booking",
          action: "package_validation",
        });
        // Continue with demo mode if package table doesn't exist
      } else if (
        packageData &&
        Math.abs(packageData.price - totalAmount) > 0.01
      ) {
        const priceError = new ValidationError("Invalid package price");
        logError(priceError, {
          ip,
          expected: packageData.price,
          received: totalAmount,
        });

        return NextResponse.json(
          { error: sanitizeErrorForProduction(priceError) },
          { status: 400 },
        );
      }

      // Check for duplicate bookings in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: recentBookings } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("user_email", customerEmail)
        .eq("package_id", packageId)
        .eq("booking_date", bookingDate)
        .eq("booking_time", bookingTime)
        .gte("created_at", fiveMinutesAgo);

      if (recentBookings && recentBookings.length > 0) {
        const duplicateError = new ValidationError(
          "A similar booking was recently created. Please check your email or wait a few minutes.",
        );
        logError(duplicateError, {
          ip,
          email: customerEmail,
          bookingDate,
          bookingTime,
          action: "duplicate_check",
        });

        return NextResponse.json(
          { error: sanitizeErrorForProduction(duplicateError) },
          { status: 409 },
        );
      }

      // First create/update customer record (BEFORE booking to avoid FK constraint)
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
          endpoint: "booking",
          action: "customer_upsert",
        });
        // Continue even if customer upsert fails for demo mode compatibility
      }

      // Now create booking in Supabase (customer already exists)
      const { data: booking, error } = await supabaseAdmin
        .from("bookings")
        .insert({
          package_id: packageId,
          user_name: customerName,
          user_email: customerEmail,
          user_phone: customerPhone,
          booking_date: bookingDate,
          booking_time: bookingTime,
          status: "pending",
          total_amount: totalAmount,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const _duration = Date.now() - startTime;

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
        },
      });
    } catch (supabaseError: unknown) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        ip,
        endpoint: "booking",
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
      endpoint: "booking",
      duration,
      action: "unexpected_error",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}
