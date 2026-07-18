import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient, requireServerAdmin } from "@/lib/auth-server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import { settingsService } from "@/lib/settings-service";
import { sendBookingCancellationEmail } from "@/lib/resend";

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireServerAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    );
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const offset = (page - 1) * limit;

    // Get admin client
    const supabase = await createServerAdminClient();

    try {
      let query = supabase.from("bookings").select(
        `
          *,
          payments (
            id,
            payment_id,
            status,
            amount,
            currency,
            created_at
          )
        `,
        { count: "exact" },
      );

      // Apply filters
      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search) {
        query = query.or(
          `user_name.ilike.%${search}%,user_email.ilike.%${search}%,user_phone.ilike.%${search}%`,
        );
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: bookings, error, count } = await query;

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        bookings: bookings || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } catch (supabaseError) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        endpoint: "admin/bookings",
        action: "fetch_bookings",
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
  } catch (error) {
    logError(error, {
      endpoint: "admin/bookings",
      action: "auth_or_unexpected",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      {
        status:
          error instanceof Error &&
          error.message.includes("Admin access required")
            ? 403
            : 500,
      },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    await requireServerAdmin();

    const body = await request.json();
    const { bookingId, status, notes } = body;

    if (!bookingId) {
      throw new ValidationError("Booking ID is required");
    }

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      throw new ValidationError("Invalid status");
    }

    // Get admin client
    const supabase = await createServerAdminClient();

    try {
      // Fetch the current booking to see its previous status and data
      const { data: currentBooking, error: fetchError } = await supabase
        .from("bookings")
        .select(`
          *,
          payments (
            id,
            amount
          )
        `)
        .eq("id", bookingId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data: booking, error } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // If status is changed to cancelled from something else, send email
      if (status === "cancelled" && currentBooking.status !== "cancelled") {
        try {
          const settings = await settingsService.getSettings();
          await sendBookingCancellationEmail(currentBooking, settings);
        } catch (emailError) {
          console.error("Failed to send cancellation email:", emailError);
        }
      }

      // If status is changed to completed, update the cash payment amount to total_amount
      if (status === "completed" && currentBooking.status !== "completed") {
        try {
          // Check if there is an existing cash payment
          const { data: payments } = await supabase
            .from("payments")
            .select("*")
            .eq("booking_id", bookingId)
            .eq("provider", "cash");
          
          if (payments && payments.length > 0) {
            // Update existing cash payment
            await supabase
              .from("payments")
              .update({ amount: currentBooking.total_amount, status: "success" })
              .eq("id", payments[0].id);
          } else {
            // Create a new cash payment record
            await supabase
              .from("payments")
              .insert({
                booking_id: bookingId,
                payment_id: "cash_" + Date.now(),
                conversation_id: "cash_" + Date.now(),
                status: "success",
                amount: currentBooking.total_amount,
                currency: "EUR",
                provider: "cash",
                provider_response: { method: "cash", auto_completed: true }
              });
          }
        } catch (paymentError) {
          console.error("Failed to process payment on completion:", paymentError);
        }
      }

      return NextResponse.json({
        success: true,
        booking,
      });
    } catch (supabaseError) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        endpoint: "admin/bookings",
        action: "update_booking",
        bookingId,
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
  } catch (error) {
    logError(error, {
      endpoint: "admin/bookings",
      action: "auth_or_unexpected",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      {
        status:
          error instanceof Error &&
          error.message.includes("Admin access required")
            ? 403
            : 500,
      },
    );
  }
}
