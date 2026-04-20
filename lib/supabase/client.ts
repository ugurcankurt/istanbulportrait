import { createBrowserClient } from "@supabase/ssr";

// Use a global variable to preserve the client across HMR (Hot Module Replacement) reloads in development
const globalForSupabaseClient = globalThis as unknown as {
  browserClient: ReturnType<typeof createBrowserClient> | undefined;
};

export function createClientSupabaseClient() {
  // Always return the memoized client if it exists in the browser
  if (globalForSupabaseClient.browserClient) return globalForSupabaseClient.browserClient;

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
    globalForSupabaseClient.browserClient = client;
  }

  return client;
}

// For backwards compatibility with existing code
export const supabaseAuth = createClientSupabaseClient();
