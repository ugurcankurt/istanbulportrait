import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface CustomerBooking {
  id: string;
  package_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  created_at: string;
  payments?: {
    amount: number;
    status: string;
  }[];
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
  updated_at?: string;
  bookings: CustomerBooking[];
  bookings_count: number;
  confirmed_bookings: number;
  total_value: number; // Total value of confirmed bookings
  total_paid: number; // Actual amount paid
  outstanding_balance: number; // Remaining to be paid
  last_booking_date: string | null;
  last_booking_status: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CustomersFilters {
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface CustomersState {
  // Data state
  customers: Customer[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;

  // Filter state
  filters: CustomersFilters;

  // Computed stats
  stats: {
    totalCustomers: number;
    totalRevenue: number;
    avgRevenuePerCustomer: number;
    repeatCustomers: number;
    repeatCustomerRate: number;
  };

  // Actions
  fetchCustomers: (
    params?: Partial<CustomersFilters & { page?: number }>,
  ) => Promise<void>;
  setFilters: (filters: Partial<CustomersFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
}

const initialFilters: CustomersFilters = {
  search: "",
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
  totalCustomers: 0,
  totalRevenue: 0,
  avgRevenuePerCustomer: 0,
  repeatCustomers: 0,
  repeatCustomerRate: 0,
};

export const useCustomersStore = create<CustomersState>()(
  devtools(
    (set, get) => ({
      // Initial state
      customers: [],
      pagination: initialPagination,
      loading: false,
      error: null,
      filters: initialFilters,
      stats: initialStats,

      // Fetch customers with filtering
      fetchCustomers: async (params = {}) => {
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

          const response = await fetch(`/api/admin/customers?${queryParams}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "Customers Store: API error:",
              response.status,
              errorText,
            );
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const rawData = await response.text();

          let data: unknown;
          try {
            data = JSON.parse(rawData);
          } catch (parseError) {
            console.error("Customers Store: JSON parse error:", parseError);
            throw new Error("Invalid JSON response from server");
          }

          // Validate response structure
          if (!data || typeof data !== "object") {
            console.error("Customers Store: Invalid response structure:", data);
            throw new Error("Invalid response structure");
          }

          const customersData = (
            Array.isArray((data as { customers: unknown }).customers)
              ? (data as { customers: unknown[] }).customers
              : []
          ) as Customer[];
          const paginationData =
            (data as { pagination: unknown }).pagination &&
              typeof (data as { pagination: unknown }).pagination === "object"
              ? {
                ...initialPagination,
                ...(data as { pagination: Pagination }).pagination,
              }
              : { ...initialPagination, page };

          // Calculate stats
          const totalCustomers = paginationData.total || 0;
          const totalRevenue = customersData.reduce(
            (sum: number, customer: Customer) => {
              const value = customer.total_value || 0;
              return sum + (typeof value === "number" ? value : 0);
            },
            0,
          );
          const totalPaid = customersData.reduce(
            (sum: number, customer: Customer) => {
              const paid = customer.total_paid || 0;
              return sum + (typeof paid === "number" ? paid : 0);
            },
            0,
          );
          const avgRevenuePerCustomer =
            totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
          const repeatCustomers = customersData.filter(
            (c: Customer) => (c.confirmed_bookings || 0) > 1,
          ).length;
          const repeatCustomerRate =
            totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

          const stats = {
            totalCustomers,
            totalRevenue, // This is total booking value
            totalPaid, // New stat: total actual cash flow
            avgRevenuePerCustomer,
            repeatCustomers,
            repeatCustomerRate,
          };

          set({
            customers: customersData,
            pagination: paginationData,
            filters,
            stats,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error("Customers Store: Fetch error:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch customers";

          set({
            customers: [],
            pagination: { ...initialPagination, page },
            stats: initialStats,
            loading: false,
            error: errorMessage,
          });
        }
      },

      // Set filters and trigger fetch
      setFilters: (newFilters: Partial<CustomersFilters>) => {
        const currentState = get();
        const updatedFilters = { ...currentState.filters, ...newFilters };

        // Reset to page 1 when filters change
        set({
          filters: updatedFilters,
          pagination: { ...currentState.pagination, page: 1 },
        });

        // Auto-fetch with new filters
        get().fetchCustomers();
      },

      // Set page and trigger fetch
      setPage: (page: number) => {
        const currentState = get();

        set({
          pagination: { ...currentState.pagination, page },
        });

        // Auto-fetch with new page
        get().fetchCustomers({ page });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store to initial state
      reset: () => {
        set({
          customers: [],
          pagination: initialPagination,
          loading: false,
          error: null,
          filters: initialFilters,
          stats: initialStats,
        });
      },
    }),
    {
      name: "customers-store",
    },
  ),
);
