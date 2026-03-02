import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient, requireServerAdmin } from "@/lib/auth-server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
} from "@/lib/errors";

interface Booking {
  id: string;
  package_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  created_at: string;
  user_email: string;
  payments?: {
    amount: number;
    status: string;
  }[];
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  bookings?: Booking[];
}

interface CustomerWithStats extends Customer {
  bookings_count: number;
  confirmed_bookings: number;
  total_value: number; // Total value of confirmed bookings (package prices)
  total_paid: number; // Actual amount paid (deposits)
  outstanding_balance: number; // Remaining to be paid
  last_booking_date: string | null;
  last_booking_status: string | null;
}

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
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const offset = (page - 1) * limit;

    // Get admin client
    const supabase = await createServerAdminClient();

    try {
      // Try the relationship query first, fallback to separate queries if needed
      // biome-ignore lint/suspicious/noExplicitAny: Query builder type is complex
      let query: any;
      let customers: Customer[] = [];
      let count: number | null = null;

      try {
        // Attempt to use the foreign key relationship
        query = supabase.from("customers").select(
          `
            *,
            bookings!bookings_user_email_fkey (
              id,
              package_id,
              booking_date,
              booking_time,
              status,
              total_amount,
              status,
              total_amount,
              created_at,
              payments (
                amount,
                status
              )
            )
          `,
          { count: "exact" },
        );
      } catch (_relationshipError) {
        // Foreign key relationship not available, using fallback method

        // Fallback: Query customers and bookings separately
        query = supabase.from("customers").select("*", { count: "exact" });
      }

      // Apply search filter
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
        );
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const result = await query;
      customers = (result.data as Customer[]) || [];
      const error = result.error;
      count = result.count;

      if (error) {
        // If the relationship query failed, try fallback method
        // Relationship query failed, using fallback method

        // Query customers separately
        const customersQuery = supabase
          .from("customers")
          .select("*", { count: "exact" });

        if (search) {
          customersQuery.or(
            `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
          );
        }

        customersQuery.order(sortBy, { ascending: sortOrder === "asc" });
        customersQuery.range(offset, offset + limit - 1);

        const {
          data: customersData,
          error: customersError,
          count: customersCount,
        } = await customersQuery;

        if (customersError) {
          throw customersError;
        }

        customers = (customersData as Customer[]) || [];
        count = customersCount;

        // Manually fetch bookings for each customer
        if (customers && customers.length > 0) {
          const customerEmails = customers.map((c) => c.email);

          const { data: bookingsData } = await supabase
            .from("bookings")
            .select(`
              id,
              package_id,
              booking_date,
              booking_time,
              status,
              total_amount,
              total_amount,
              created_at,
              user_email,
              payments (
                amount,
                status
              )
            `)
            .in("user_email", customerEmails);

          // Group bookings by email
          const bookingsByEmail = (bookingsData || []).reduce(
            (acc: Record<string, Booking[]>, booking: Booking) => {
              if (!acc[booking.user_email]) {
                acc[booking.user_email] = [];
              }
              acc[booking.user_email].push(booking);
              return acc;
            },
            {} as Record<string, Booking[]>,
          );

          // Add bookings to customers
          customers = customers.map((customer) => ({
            ...customer,
            bookings: bookingsByEmail[customer.email] || [],
          }));
        }
      }

      // Calculate customer analytics
      const customersWithStats: CustomerWithStats[] = (customers || []).map(
        (customer) => {
          const bookings = customer.bookings || [];
          const confirmedBookings = bookings.filter(
            (b) => b.status === "confirmed",
          );

          // Calculate financials for confirmed bookings only
          const totalValue = confirmedBookings.reduce(
            (sum, b) => sum + b.total_amount,
            0,
          );

          // Calculate total paid (sum of successful payments for confirmed bookings)
          const totalPaid = confirmedBookings.reduce((sum, b) => {
            const bookingPayments = b.payments || [];
            const successfulPayments = bookingPayments
              .filter((p) => p.status === "success")
              .reduce((pSum, p) => pSum + p.amount, 0);
            return sum + successfulPayments;
          }, 0);

          const lastBooking =
            bookings.length > 0
              ? bookings.sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              )[0]
              : null;

          return {
            ...customer,
            bookings_count: bookings.length,
            confirmed_bookings: confirmedBookings.length,
            total_value: totalValue,
            total_paid: totalPaid,
            outstanding_balance: totalValue - totalPaid,
            last_booking_date: lastBooking?.created_at || null,
            last_booking_status: lastBooking?.status || null,
          };
        },
      );

      return NextResponse.json({
        success: true,
        customers: customersWithStats,
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
        endpoint: "admin/customers",
        action: "fetch_customers",
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
      endpoint: "admin/customers",
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
