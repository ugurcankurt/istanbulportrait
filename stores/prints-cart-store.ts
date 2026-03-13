import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface PrintCartItem {
    id: string; // Unique ID for the cart item instance (uuid)
    productId: string; // Prodigi Product ID (optional, if we use SKUs primarily)
    sku: string; // Prodigi SKU (e.g., GLOBAL-CANVAS-10X8)
    name: string; // Human readable name
    price: number; // Price charged to customer
    currency: string;
    quantity: number;
    uploadUrl: string; // The URL of the user's uploaded image on Supabase Storage
    attributes?: Record<string, string>; // e.g., frame color, finish
    addedAt: string;
}

interface PrintsCartState {
    items: PrintCartItem[];
    isCartOpen: boolean;

    // Actions
    addPrintToCart: (item: Omit<PrintCartItem, "addedAt" | "id">) => void;
    removePrintFromCart: (id: string) => void;
    updatePrintQuantity: (id: string, quantity: number) => void;
    clearPrintsCart: () => void;
    setCartOpen: (open: boolean) => void;

    // Getters
    getTotalPrice: () => number;
    getTotalItems: () => number;
}

export const usePrintsCartStore = create<PrintsCartState>()(
    devtools(
        persist(
            (set, get) => ({
                items: [],
                isCartOpen: false,

                addPrintToCart: (newItem) => {
                    const id = crypto.randomUUID();
                    set((state) => ({
                        items: [
                            ...state.items,
                            {
                                ...newItem,
                                id,
                                addedAt: new Date().toISOString(),
                            },
                        ],
                        isCartOpen: true,
                    }));
                },

                removePrintFromCart: (id) => {
                    set((state) => ({
                        items: state.items.filter((item) => item.id !== id),
                    }));
                },

                updatePrintQuantity: (id, quantity) => {
                    if (quantity < 1) return;
                    set((state) => ({
                        items: state.items.map((item) =>
                            item.id === id ? { ...item, quantity } : item
                        ),
                    }));
                },

                clearPrintsCart: () => {
                    set({ items: [], isCartOpen: false });
                },

                setCartOpen: (open) => {
                    set({ isCartOpen: open });
                },

                getTotalPrice: () => {
                    const state = get();
                    return state.items.reduce(
                        (total, item) => total + item.price * item.quantity,
                        0
                    );
                },

                getTotalItems: () => {
                    const state = get();
                    return state.items.reduce(
                        (total, item) => total + item.quantity,
                        0
                    );
                },
            }),
            {
                name: "istanbul-portrait-prints-cart",
                partialize: (state) => ({ items: state.items }),
            }
        ),
        { name: "prints-cart-store" }
    )
);
