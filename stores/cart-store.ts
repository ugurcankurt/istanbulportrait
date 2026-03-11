/**
 * Cart Store — Zustand with localStorage persistence
 *
 * Since this is a photography booking site, the cart holds ONE item at a time:
 * the package + booking details the customer filled in the booking modal.
 * Adding a new item replaces the existing one.
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface CartItem {
    packageId: string;
    packageName: string;
    /** Total price (after seasonal discount), NOT deposit */
    price: number;
    /** 30% deposit amount — what will actually be charged */
    depositAmount: number;
    currency: string;
    // Booking details
    bookingDate: string;
    bookingTime: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes?: string;
    peopleCount?: number;
    addedAt: string; // ISO timestamp
}

interface CartState {
    item: CartItem | null;
    isCartOpen: boolean;

    // Actions
    addToCart: (item: Omit<CartItem, "addedAt">) => void;
    removeFromCart: () => void;
    clearCart: () => void;
    setCartOpen: (open: boolean) => void;
}

export const useCartStore = create<CartState>()(
    devtools(
        persist(
            (set) => ({
                item: null,
                isCartOpen: false,

                addToCart: (newItem) => {
                    set({
                        item: {
                            ...newItem,
                            addedAt: new Date().toISOString(),
                        },
                        isCartOpen: true,
                    });
                },

                removeFromCart: () => {
                    set({ item: null });
                },

                clearCart: () => {
                    set({ item: null, isCartOpen: false });
                },

                setCartOpen: (open) => {
                    set({ isCartOpen: open });
                },
            }),
            {
                name: "istanbul-portrait-cart",
                // Only persist the item, not the UI open state
                partialize: (state) => ({ item: state.item }),
            },
        ),
        { name: "cart-store" },
    ),
);
