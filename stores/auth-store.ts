import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  signOut as authSignOut,
  getCurrentUser,
  isAdmin,
  onAuthStateChange,
  signInWithEmail,
} from "@/lib/auth";

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isAdminUser: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isAdminUser: false,
        loading: true,
        error: null,

        // Sign in action
        signIn: async (email: string, password: string) => {
          set({ loading: true, error: null });

          try {
            const { user } = await signInWithEmail(email, password);

            if (!user?.email) {
              throw new Error("Invalid user data received");
            }

            const isUserAdmin = await isAdmin(user.email);

            if (!isUserAdmin) {
              throw new Error(
                "Access denied. This account is not authorized for admin access.",
              );
            }

            set({
              user,
              isAuthenticated: true,
              isAdminUser: true,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error("Auth Store: Sign in error:", error);
            const errorMessage =
              error instanceof Error ? error.message : "Sign in failed";

            set({
              user: null,
              isAuthenticated: false,
              isAdminUser: false,
              loading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        // Sign out action
        signOut: async () => {
          set({ loading: true });

          try {
            await authSignOut();

            set({
              user: null,
              isAuthenticated: false,
              isAdminUser: false,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error("Auth Store: Sign out error:", error);

            // Even if sign out fails, clear local state
            set({
              user: null,
              isAuthenticated: false,
              isAdminUser: false,
              loading: false,
              error: null,
            });
          }
        },

        // Check current authentication status
        checkAuth: async () => {
          set({ loading: true, error: null });

          try {
            const currentUser = await getCurrentUser();

            if (!currentUser) {
              set({
                user: null,
                isAuthenticated: false,
                isAdminUser: false,
                loading: false,
                error: null,
              });
              return;
            }

            const isUserAdmin = await isAdmin(currentUser.email);

            if (!isUserAdmin) {
              set({
                user: null,
                isAuthenticated: false,
                isAdminUser: false,
                loading: false,
                error: "Admin access required",
              });
              return;
            }

            set({
              user: currentUser,
              isAuthenticated: true,
              isAdminUser: true,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error("Auth Store: Auth check error:", error);
            set({
              user: null,
              isAuthenticated: false,
              isAdminUser: false,
              loading: false,
              error: "Authentication check failed",
            });
          }
        },

        // Clear error state
        clearError: () => {
          set({ error: null });
        },

        // Initialize auth state and listeners
        initialize: () => {
          // Check initial auth state
          get().checkAuth();

          // Listen for auth state changes
          const {
            data: { subscription },
          } = onAuthStateChange(async (user) => {
            if (!user) {
              set({
                user: null,
                isAuthenticated: false,
                isAdminUser: false,
                loading: false,
                error: null,
              });
              return;
            }

            try {
              const isUserAdmin = await isAdmin(user.email);

              set({
                user,
                isAuthenticated: true,
                isAdminUser: isUserAdmin,
                loading: false,
                error: isUserAdmin ? null : "Admin access required",
              });
            } catch (error) {
              console.error("Auth Store: Auth state change error:", error);
              set({
                user: null,
                isAuthenticated: false,
                isAdminUser: false,
                loading: false,
                error: "Authentication verification failed",
              });
            }
          });

          // Store subscription for cleanup
          (window as any).__authSubscription = subscription;
        },
      }),
      {
        name: "admin-auth",
        partialize: (state) => ({
          // Only persist user data, not loading/error states
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          isAdminUser: state.isAdminUser,
        }),
      },
    ),
    {
      name: "auth-store",
    },
  ),
);

// Auto-initialize on store creation (only once)
let initialized = false;
if (typeof window !== "undefined" && !initialized) {
  initialized = true;
  // Delay initialization to allow auth to settle
  setTimeout(() => {
    useAuthStore.getState().initialize();
  }, 100);
}
