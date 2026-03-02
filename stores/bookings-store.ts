import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Payment {
  id: string;
  payment_id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface Booking {
  id: string;
  package_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  payments: Payment[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BookingsFilters {
  search: string;
  statusFilter: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface BookingsState {
  // Data state
  bookings: Booking[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;

  // Filter state
  filters: BookingsFilters;

  // Actions
  fetchBookings: (
    params?: Partial<BookingsFilters & { page?: number }>,
  ) => Promise<void>;
  updateBooking: (
    id: string,
    updates: { status: string; notes?: string },
  ) => Promise<void>;
  setFilters: (filters: Partial<BookingsFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
}

const initialFilters: BookingsFilters = {
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

export const useBookingsStore = create<BookingsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      bookings: [],
      pagination: initialPagination,
      loading: false,
      error: null,
      filters: initialFilters,

      // Fetch bookings with filtering
      fetchBookings: async (params = {}) => {
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

          const response = await fetch(`/api/admin/bookings?${queryParams}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "Bookings Store: API error:",
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
            console.error("Bookings Store: JSON parse error:", parseError);
            throw new Error("Invalid JSON response from server");
          }

          // Validate response structure
          if (!data || typeof data !== "object") {
            console.error("Bookings Store: Invalid response structure:", data);
            throw new Error("Invalid response structure");
          }

          const bookingsData = (
            Array.isArray((data as { bookings: unknown }).bookings)
              ? (data as { bookings: unknown[] }).bookings
              : []
          ) as Booking[];

          const paginationData =
            (data as { pagination?: Pagination }).pagination &&
            typeof (data as { pagination?: Pagination }).pagination === "object"
              ? {
                  ...initialPagination,
                  ...(data as { pagination: Pagination }).pagination,
                }
              : { ...initialPagination, page };

          set({
            bookings: bookingsData,
            pagination: paginationData,
            filters,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error("Bookings Store: Fetch error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch bookings";

          set({
            bookings: [],
            pagination: { ...initialPagination, page },
            loading: false,
            error: errorMessage,
          });
        }
      },

      // Update booking status and notes
      updateBooking: async (
        id: string,
        updates: { status: string; notes?: string },
      ) => {
        try {
          const response = await fetch("/api/admin/bookings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: id,
              ...updates,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              "Bookings Store: Update error:",
              response.status,
              errorText,
            );
            throw new Error(`Failed to update booking: ${response.status}`);
          }

          const _data = await response.json();

          // Refresh bookings list to reflect changes
          await get().fetchBookings();
        } catch (error) {
          console.error("Bookings Store: Update error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update booking";
          set({ error: errorMessage });
          throw error;
        }
      },

      // Set filters and trigger fetch
      setFilters: (newFilters: Partial<BookingsFilters>) => {
        const currentState = get();
        const updatedFilters = { ...currentState.filters, ...newFilters };

        // Reset to page 1 when filters change
        set({
          filters: updatedFilters,
          pagination: { ...currentState.pagination, page: 1 },
        });

        // Auto-fetch with new filters
        get().fetchBookings();
      },

      // Set page and trigger fetch
      setPage: (page: number) => {
        const currentState = get();

        set({
          pagination: { ...currentState.pagination, page },
        });

        // Auto-fetch with new page
        get().fetchBookings({ page });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store to initial state
      reset: () => {
        set({
          bookings: [],
          pagination: initialPagination,
          loading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    {
      name: "bookings-store",
    },
  ),
);
