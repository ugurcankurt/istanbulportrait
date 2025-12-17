import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface PaymentBooking {
  id: string;
  package_id: string;
  user_name: string;
  user_email: string;
  booking_date: string;
  booking_time: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  payment_id: string;
  conversation_id: string;
  status: "success" | "failure" | "pending";
  amount: number;
  currency: string;
  provider: string;
  provider_response?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  bookings: PaymentBooking | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaymentsFilters {
  search: string;
  statusFilter: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface PaymentsState {
  // Data state
  payments: Payment[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;

  // Filter state
  filters: PaymentsFilters;

  // Computed stats
  stats: {
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    successRate: number;
  };

  // Actions
  fetchPayments: (
    params?: Partial<PaymentsFilters & { page?: number }>,
  ) => Promise<void>;
  setFilters: (filters: Partial<PaymentsFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
}

const initialFilters: PaymentsFilters = {
  search: "",
  statusFilter: "all",
  dateFrom: "",
  dateTo: "",
  sortBy: "created_at",
  sortOrder: "desc",
};

const initialPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

const initialStats = {
  totalAmount: 0,
  successfulPayments: 0,
  failedPayments: 0,
  pendingPayments: 0,
  successRate: 0,
};

export const usePaymentsStore = create<PaymentsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      payments: [],
      pagination: initialPagination,
      loading: false,
      error: null,
      filters: initialFilters,
      stats: initialStats,

      // Fetch payments with filtering
      fetchPayments: async (params = {}) => {
        set({ loading: true, error: null });

        const currentState = get();
        const filters = { ...currentState.filters, ...params };
        const page = params.page ?? currentState.pagination.page;

        try {
          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: currentState.pagination.limit.toString(),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          });

          if (filters.search) queryParams.set("search", filters.search);
          if (filters.statusFilter !== "all")
            queryParams.set("status", filters.statusFilter);
          if (filters.dateFrom) queryParams.set("dateFrom", filters.dateFrom);
          if (filters.dateTo) queryParams.set("dateTo", filters.dateTo);

          const response = await fetch(`/api/admin/payments?${queryParams}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "Payments Store: API error:",
              response.status,
              errorText,
            );
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const rawData = await response.text();

          interface PaymentsResponse {
            payments: unknown[];
            pagination: Pagination;
          }
          let data: PaymentsResponse;
          try {
            data = JSON.parse(rawData) as PaymentsResponse;
          } catch (parseError) {
            console.error("Payments Store: JSON parse error:", parseError);
            throw new Error("Invalid JSON response from server");
          }

          // Validate response structure
          if (!data || typeof data !== "object") {
            console.error("Payments Store: Invalid response structure:", data);
            throw new Error("Invalid response structure");
          }

          const paymentsData = Array.isArray(data.payments)
            ? data.payments
            : [];
          const paginationData =
            data.pagination && typeof data.pagination === "object"
              ? { ...initialPagination, ...data.pagination }
              : { ...initialPagination, page };

          // Process payments data - fix nested bookings relationship
          const processedPayments = paymentsData
            .map((paymentItem: unknown) => {
              if (!paymentItem || typeof paymentItem !== "object") {
                return null;
              }
              const p = paymentItem as Payment;

              // Handle bookings relationship data - convert array to single object if needed
              if (p.bookings && Array.isArray(p.bookings)) {
                p.bookings = p.bookings[0] || null;
              }
              return p;
            })
            .filter((p): p is Payment => p !== null);

          // Calculate stats
          const successfulPayments = processedPayments.filter(
            (p) => p.status === "success",
          );
          const failedPayments = processedPayments.filter(
            (p) => p.status === "failure",
          );
          const pendingPayments = processedPayments.filter(
            (p) => p.status === "pending",
          );

          const totalAmount = successfulPayments.reduce((sum, payment) => {
            const amount = payment.amount || 0;
            return sum + (typeof amount === "number" ? amount : 0);
          }, 0);

          const successRate =
            processedPayments.length > 0
              ? (successfulPayments.length / processedPayments.length) * 100
              : 0;

          const stats = {
            totalAmount,
            successfulPayments: successfulPayments.length,
            failedPayments: failedPayments.length,
            pendingPayments: pendingPayments.length,
            successRate,
          };

          set({
            payments: processedPayments,
            pagination: paginationData,
            filters,
            stats,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error("Payments Store: Fetch error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch payments";

          set({
            payments: [],
            pagination: { ...initialPagination, page },
            stats: initialStats,
            loading: false,
            error: errorMessage,
          });
        }
      },

      // Set filters and trigger fetch
      setFilters: (newFilters: Partial<PaymentsFilters>) => {
        const currentState = get();
        const updatedFilters = { ...currentState.filters, ...newFilters };

        // Reset to page 1 when filters change
        set({
          filters: updatedFilters,
          pagination: { ...currentState.pagination, page: 1 },
        });

        // Auto-fetch with new filters
        get().fetchPayments();
      },

      // Set page and trigger fetch
      setPage: (page: number) => {
        const currentState = get();

        set({
          pagination: { ...currentState.pagination, page },
        });

        // Auto-fetch with new page
        get().fetchPayments({ page });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store to initial state
      reset: () => {
        set({
          payments: [],
          pagination: initialPagination,
          loading: false,
          error: null,
          filters: initialFilters,
          stats: initialStats,
        });
      },
    }),
    {
      name: "payments-store",
    },
  ),
);
