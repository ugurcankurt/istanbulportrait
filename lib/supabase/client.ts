import { createBrowserClient } from "@supabase/ssr";

export function createClientSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Ensure sessions are properly persisted
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // Remove localStorage storage - let SSR handle cookies automatically
      },
    },
  );
}

// For backwards compatibility with existing code
export const supabaseAuth = createClientSupabaseClient();
