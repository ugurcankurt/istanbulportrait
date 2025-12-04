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
