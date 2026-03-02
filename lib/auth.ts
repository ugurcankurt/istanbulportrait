import type { User } from "@supabase/supabase-js";
import { createClientSupabaseClient } from "./supabase/client";

// Client-side Supabase client - ONLY use in client components
export const supabaseAuth = createClientSupabaseClient();

// Helper to check if we're on client-side and have storage available
function isClientSide(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
}

export async function signInWithEmail(email: string, password: string) {
  try {
    // Client-side only - use browser client directly
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { user: data.user, session: data.session };
  } catch (error) {
    console.error("Client: Sign in error:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    // Client-side only - use browser client directly
    const { error } = await supabaseAuth.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Client: Sign out error:", error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  // Only work on client-side
  if (!isClientSide()) {
    return null;
  }

  try {
    // Client-side only - use browser client directly
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser();

    if (error) {
      // Handle AuthSessionMissingError gracefully - this is normal on initial load
      if (
        error.message === "Auth session missing!" ||
        error.message?.includes("session_not_found")
      ) {
        return null;
      }
      console.error("Client: Get user error:", error);
      return null;
    }

    return user;
  } catch (error: any) {
    // Handle AuthSessionMissingError gracefully - this is normal on initial load
    if (
      error?.message === "Auth session missing!" ||
      error?.message?.includes("session_not_found")
    ) {
      return null;
    }
    console.error("Client: Get current user error:", error);
    return null;
  }
}

export async function getSession() {
  // Only work on client-side
  if (!isClientSide()) {
    return null;
  }

  try {
    // Client-side only - use browser client directly
    const {
      data: { session },
      error,
    } = await supabaseAuth.auth.getSession();

    if (error) {
      // Handle AuthSessionMissingError gracefully - this is normal on initial load
      if (
        error.message === "Auth session missing!" ||
        error.message?.includes("session_not_found")
      ) {
        return null;
      }
      console.error("Client: Get session error:", error);
      return null;
    }

    return session;
  } catch (error: any) {
    // Handle AuthSessionMissingError gracefully - this is normal on initial load
    if (
      error?.message === "Auth session missing!" ||
      error?.message?.includes("session_not_found")
    ) {
      return null;
    }
    console.error("Client: Get session error:", error);
    return null;
  }
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  // Only use auth state change on client-side
  if (typeof window !== "undefined") {
    return supabaseAuth.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
  }

  // Return empty subscription for server-side
  return {
    data: {
      subscription: {
        unsubscribe: () => {},
      },
    },
  };
}

export async function isAdmin(email?: string): Promise<boolean> {
  if (!email) {
    const user = await getCurrentUser();
    email = user?.email;
  }

  if (!email) return false;

  const adminEmails = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@istanbulportrait.com",
  ];

  return adminEmails.includes(email.toLowerCase());
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Client: Authentication required");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  const isAdminUser = await isAdmin(user.email);

  if (!isAdminUser) {
    throw new Error("Client: Admin access required");
  }

  return user;
}
