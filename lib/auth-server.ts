import type { User } from "@supabase/supabase-js";
import {
  createServerSupabaseAdminClient,
  createServerSupabaseClient,
} from "./supabase/server";

// Server-side authentication utilities
// ONLY use these in Server Components, API routes, and middleware

export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth: Get user error:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth: Get current user error:", error);
    return null;
  }
}

export async function getServerSession() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Server: Get session error:", error);
      return null;
    }

    return session;
  } catch (error) {
    console.error("Server: Get session error:", error);
    return null;
  }
}

export async function isServerAdmin(email?: string): Promise<boolean> {
  if (!email) {
    const user = await getServerUser();
    email = user?.email;
  }

  if (!email) {
    return false;
  }

  const adminEmails = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@istanbulportrait.com",
  ];

  const isAdmin = adminEmails.includes(email.toLowerCase());

  return isAdmin;
}

export async function requireServerAuth(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function requireServerAdmin(): Promise<User> {
  const user = await requireServerAuth();
  const isAdminUser = await isServerAdmin(user.email);

  if (!isAdminUser) {
    throw new Error("Admin access required");
  }

  return user;
}

export async function createServerAdminClient() {
  const client = await createServerSupabaseAdminClient();
  return client;
}
