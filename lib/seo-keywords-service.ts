import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { packagesService, type PackageDB } from "./packages-service";

export interface SeoKeywordIntent {
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  cover_image: string;
  related_packages: string[];
}

const getSupabaseClient = () => {
  if (typeof window !== "undefined") {
    const { supabaseAuth } = require("@/lib/supabase/client");
    return supabaseAuth;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const seoKeywordsService = {
  /**
   * Get all active search intents
   */
  getAllIntents: cache(async (): Promise<SeoKeywordIntent[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("seo_keyword_intents")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching seo keyword intents:", error);
      return [];
    }
    return data as SeoKeywordIntent[];
  }),

  /**
   * Get a specific intent by its slug
   */
  getIntentBySlug: cache(async (slug: string): Promise<SeoKeywordIntent | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("seo_keyword_intents")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error) {
      // Don't log if it's just a 404
      if (error.code !== "PGRST116") {
        console.error(`Error fetching seo intent ${slug}:`, error);
      }
      return null;
    }
    return data as SeoKeywordIntent;
  }),

  /**
   * Get packages associated with a specific intent
   */
  getPackagesForIntent: cache(async (intent: SeoKeywordIntent): Promise<PackageDB[]> => {
    if (!intent.related_packages || intent.related_packages.length === 0) return [];
    
    const allPackages = await packagesService.getActivePackages();
    return allPackages.filter(pkg => intent.related_packages.includes(pkg.slug));
  })
};

