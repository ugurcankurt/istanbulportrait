import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface DashboardStats {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_revenue: number;
  monthly_revenue: number;
  total_customers: number;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
}

interface RecentBooking {
  id: string;
  user_name: string;
  user_email: string;
  package_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface DashboardState {
  // Data state
  stats: DashboardStats | null;
  recentBookings: RecentBooking[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchDashboardData: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialStats: DashboardStats = {
  total_bookings: 0,
  pending_bookings: 0,
  confirmed_bookings: 0,
  cancelled_bookings: 0,
  total_revenue: 0,
  monthly_revenue: 0,
  total_customers: 0,
  total_payments: 0,
  successful_payments: 0,
  failed_payments: 0,
};

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, _get) => ({
      // Initial state
      stats: null,
      recentBookings: [],
      loading: false,
      error: null,

      // Fetch dashboard data (stats + recent bookings)
      fetchDashboardData: async () => {
        set({ loading: true, error: null });

        try {
          // Fetch both stats and recent bookings in parallel
          const [statsResponse, bookingsResponse] = await Promise.all([
            fetch("/api/admin/stats"),
            fetch(
              "/api/admin/bookings?limit=5&sortBy=created_at&sortOrder=desc",
            ),
          ]);

          // Handle stats response
          if (!statsResponse.ok) {
            const statsError = await statsResponse.text();
            console.error("Dashboard Store: Stats API error:", statsError);
            throw new Error(
              `Failed to fetch dashboard stats: ${statsResponse.status}`,
            );
          }

          // Handle bookings response
          if (!bookingsResponse.ok) {
            const bookingsError = await bookingsResponse.text();
            console.error(
              "Dashboard Store: Bookings API error:",
              bookingsError,
            );
            throw new Error(
              `Failed to fetch recent bookings: ${bookingsResponse.status}`,
            );
          }

          // Parse responses
          const statsData = await statsResponse.json();
          const bookingsData = await bookingsResponse.json();

          // Validate and extract data
          const stats = statsData?.stats || initialStats;
          const recentBookings = Array.isArray(bookingsData?.bookings)
            ? bookingsData.bookings
            : [];

          // Ensure stats have safe defaults
          const validatedStats = {
            total_bookings: stats.total_bookings || 0,
            pending_bookings: stats.pending_bookings || 0,
            confirmed_bookings: stats.confirmed_bookings || 0,
            cancelled_bookings: stats.cancelled_bookings || 0,
            total_revenue: stats.total_revenue || 0,
            monthly_revenue: stats.monthly_revenue || 0,
            total_customers: stats.total_customers || 0,
            total_payments: stats.total_payments || 0,
            successful_payments: stats.successful_payments || 0,
            failed_payments: stats.failed_payments || 0,
          };

          set({
            stats: validatedStats,
            recentBookings,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error("Dashboard Store: Fetch error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to load dashboard data";

          set({
            stats: initialStats,
            recentBookings: [],
            loading: false,
            error: errorMessage,
          });
        }
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store to initial state
      reset: () => {
        set({
          stats: null,
          recentBookings: [],
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: "dashboard-store",
    },
  ),
);
