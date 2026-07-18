import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface BookingDetails {
  user_name: string;
  user_email: string;
}

export interface PaymentAdmin {
  id: string;
  booking_id: string;
  payment_id: string;
  status: "pending" | "success" | "failure";
  amount: number;
  currency: string;
  provider: string;
  created_at: string;
  bookings?: BookingDetails | null;
  provider_response?: any;
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
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface PaymentsState {
  payments: PaymentAdmin[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  filters: PaymentsFilters;

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
  sortBy: "created_at",
  sortOrder: "desc",
};

const initialPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export const usePaymentsStore = create<PaymentsState>()(
  devtools(
    (set, get) => ({
      payments: [],
      pagination: initialPagination,
      loading: false,
      error: null,
      filters: initialFilters,

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

          const response = await fetch(`/api/admin/payments?${queryParams}`);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const rawData = await response.text();

          let data: unknown;
          try {
            data = JSON.parse(rawData);
          } catch (parseError) {
            throw new Error("Invalid JSON response from server");
          }

          if (!data || typeof data !== "object") {
            throw new Error("Invalid response structure");
          }

          const paymentsData = (
            Array.isArray((data as { payments: unknown }).payments)
              ? (data as { payments: unknown[] }).payments
              : []
          ) as PaymentAdmin[];

          const paginationData =
            (data as { pagination?: Pagination }).pagination &&
            typeof (data as { pagination?: Pagination }).pagination === "object"
              ? {
                  ...initialPagination,
                  ...(data as { pagination: Pagination }).pagination,
                }
              : { ...initialPagination, page };

          set({
            payments: paymentsData,
            pagination: paginationData,
            filters,
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
            loading: false,
            error: errorMessage,
          });
        }
      },

      setFilters: (newFilters: Partial<PaymentsFilters>) => {
        const currentState = get();
        const updatedFilters = { ...currentState.filters, ...newFilters };

        set({
          filters: updatedFilters,
          pagination: { ...currentState.pagination, page: 1 },
        });

        get().fetchPayments();
      },

      setPage: (page: number) => {
        const currentState = get();

        set({
          pagination: { ...currentState.pagination, page },
        });

        get().fetchPayments({ page });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          payments: [],
          pagination: initialPagination,
          loading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    {
      name: "payments-store",
    },
  ),
);
