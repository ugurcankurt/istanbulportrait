import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClientSupabaseClient() {
  // Always return the memoized client if it exists in the browser
  if (browserClient) return browserClient;

  const client = createBrowserClient(
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

  // Memoize it for subsequent calls in the browser environment
  if (typeof window !== "undefined") {
    browserClient = client;
  }

  return client;
}

// For backwards compatibility with existing code
export const supabaseAuth = createClientSupabaseClient();
