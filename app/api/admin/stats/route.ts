import { NextResponse } from "next/server";
import { createServerAdminClient, requireServerAdmin } from "@/lib/auth-server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
} from "@/lib/errors";

export async function GET() {
  try {
    // Verify admin access
    await requireServerAdmin();

    // Get admin client
    const supabase = await createServerAdminClient();

    try {
      // Get dashboard statistics using the view
      const { data: stats, error: statsError } = await supabase
        .from("admin_dashboard_stats")
        .select("*")
        .single();

      if (statsError && statsError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" - handle gracefully
        throw statsError;
      }

      // If view doesn't exist or returns no data, calculate manually
      if (!stats) {
        const [bookingsResult, customersResult, paymentsResult] =
          await Promise.all([
            supabase
              .from("bookings")
              .select("status, total_amount, created_at"),
            supabase.from("customers").select("id"),
            supabase.from("payments").select("status, amount, created_at"),
          ]);

        const bookings = bookingsResult.data || [];
        const customers = customersResult.data || [];
        const payments = paymentsResult.data || [];

        // Calculate current month revenue
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1,
        );

        const monthlyRevenue = bookings
          .filter(
            (booking) =>
              booking.status === "confirmed" &&
              new Date(booking.created_at) >= firstDayOfMonth,
          )
          .reduce((sum, booking) => sum + booking.total_amount, 0);

        const manualStats = {
          total_bookings: bookings.length,
          pending_bookings: bookings.filter((b) => b.status === "pending")
            .length,
          confirmed_bookings: bookings.filter((b) => b.status === "confirmed")
            .length,
          cancelled_bookings: bookings.filter((b) => b.status === "cancelled")
            .length,
          total_revenue: bookings
            .filter((b) => b.status === "confirmed")
            .reduce((sum, b) => sum + b.total_amount, 0),
          monthly_revenue: monthlyRevenue || 0,
          total_customers: customers.length,
          total_payments: payments.length,
          successful_payments: payments.filter((p) => p.status === "success")
            .length,
          failed_payments: payments.filter((p) => p.status === "failure")
            .length,
        };

        return NextResponse.json({
          success: true,
          stats: manualStats,
        });
      }

      // Ensure monthly_revenue is included with fallback
      const statsWithFallback = {
        ...stats,
        monthly_revenue: stats.monthly_revenue ?? 0,
      };

      return NextResponse.json({
        success: true,
        stats: statsWithFallback,
      });
    } catch (supabaseError) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        endpoint: "admin/stats",
        action: "fetch_stats",
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
      endpoint: "admin/stats",
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
