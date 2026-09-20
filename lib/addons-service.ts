import { createClient } from "@supabase/supabase-js";
import { cache } from "react";

export interface AddonDB {
  id: string;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  price: number;
  is_per_person: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Ensure the client uses the right keys (either server or client boundary depending on usage)
const getSupabaseClient = () => {
  if (typeof window !== "undefined") {
    // In Browser: use the initialized auth client which holds the Admin Session
    const { supabaseAuth } = require("@/lib/supabase/client");
    return supabaseAuth;
  }

  // On Server: use Service Role for unrestricted DB fetch or fallback to ANON
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
};

export const addonsService = {
  /** Fetch all addons — works in both Server Components and Client Components */
  async getAllAddonsAdmin(): Promise<AddonDB[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("addons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      // Table may not exist yet — return empty array gracefully
      console.error("Error fetching addons:", error.message);
      return [];
    }
    return (data as AddonDB[]) || [];
  },

  async deleteAddon(id: string): Promise<void> {
    const res = await fetch(`/api/admin/addons/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete addon");
  },

  getActiveAddonsForPackage: cache(async (packageId: string): Promise<AddonDB[]> => {
    const supabase = getSupabaseClient();

    const { data: packageAddons, error: relationError } = await supabase
      .from("package_addons")
      .select("addon_id")
      .eq("package_id", packageId);

    if (relationError || !packageAddons || packageAddons.length === 0) return [];

    const addonIds = packageAddons.map((pa: any) => pa.addon_id);

    const { data: addons, error } = await supabase
      .from("addons")
      .select("*")
      .in("id", addonIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching addons for package:", error);
      return [];
    }

    return addons as AddonDB[];
  }),
};
