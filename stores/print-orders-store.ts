import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface PrintOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_postal_code: string;
  shipping_town_city: string;
  shipping_state_county: string | null;
  shipping_country_code: string;
  sku: string;
  image_url: string;
  copies: number;
  total_amount: number;
  shipping_amount: number;
  tax_amount: number;
  order_total_amount: number;
  currency: string;
  payment_status: string;
  prodigi_order_id: string | null;
  prodigi_status: string;
  iyzico_payment_id: string | null;
  shipping_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PrintOrdersFilters {
  search: string;
  statusFilter: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface PrintOrdersState {
  // Data state
  orders: PrintOrder[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;

  // Filter state
  filters: PrintOrdersFilters;

  // Actions
  fetchOrders: (
    params?: Partial<PrintOrdersFilters & { page?: number }>,
  ) => Promise<void>;
  updateOrder: (
    id: string,
    updates: { paymentStatus?: string },
  ) => Promise<void>;
  setFilters: (filters: Partial<PrintOrdersFilters>) => void;
  setPage: (page: number) => void;
  clearError: () => void;
  reset: () => void;
}

const initialFilters: PrintOrdersFilters = {
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

export const usePrintOrdersStore = create<PrintOrdersState>()(
  devtools(
    (set, get) => ({
      // Initial state
      orders: [],
      pagination: initialPagination,
      loading: false,
      error: null,
      filters: initialFilters,

      // Fetch orders with filtering
      fetchOrders: async (params = {}) => {
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

          const response = await fetch(`/api/admin/print-orders?${queryParams}`);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
          }

          const data = await response.json();

          set({
            orders: data.orders || [],
            pagination: data.pagination || { ...initialPagination, page },
            filters,
            loading: false,
            error: null,
          });
        } catch (error) {
          console.error("Print Orders Store: Fetch error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch orders";

          set({
            orders: [],
            pagination: { ...initialPagination, page },
            loading: false,
            error: errorMessage,
          });
        }
      },

      // Update order status
      updateOrder: async (id: string, updates: { paymentStatus?: string }) => {
        try {
          const response = await fetch("/api/admin/print-orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: id,
              ...updates,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update order: ${response.status}`);
          }

          // Refresh orders list
          await get().fetchOrders();
        } catch (error) {
          console.error("Print Orders Store: Update error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Failed to update order";
          set({ error: errorMessage });
          throw error;
        }
      },

      // Set filters and trigger fetch
      setFilters: (newFilters: Partial<PrintOrdersFilters>) => {
        const currentState = get();
        const updatedFilters = { ...currentState.filters, ...newFilters };

        set({
          filters: updatedFilters,
          pagination: { ...currentState.pagination, page: 1 },
        });

        get().fetchOrders();
      },

      // Set page and trigger fetch
      setPage: (page: number) => {
        const currentState = get();

        set({
          pagination: { ...currentState.pagination, page },
        });

        get().fetchOrders({ page });
      },

      // Clear error state
      clearError: () => {
        set({ error: null });
      },

      // Reset store
      reset: () => {
        set({
          orders: [],
          pagination: initialPagination,
          loading: false,
          error: null,
          filters: initialFilters,
        });
      },
    }),
    {
      name: "print-orders-store",
    },
  ),
);
