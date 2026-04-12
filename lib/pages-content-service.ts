import { createClient } from "@supabase/supabase-js";

export interface PageTranslations {
  en: string;
  ar?: string;
  ru?: string;
  es?: string;
  zh?: string;
  de?: string;
  fr?: string;
  ro?: string;
  tr?: string;
  [key: string]: string | undefined;
}

export interface PageDB {
  id: string;
  slug: string;
  title: PageTranslations;
  subtitle: PageTranslations;
  content?: Record<string, any> | null;
  cover_image?: string | null;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
}

const getSupabaseClient = () => {
  if (typeof window !== "undefined") {
    // In Browser: use the initialized auth client which holds the Admin Session
    const { supabaseAuth } = require("@/lib/supabase/client");
    return supabaseAuth;
  }

  // On Server: use Service Role for unrestricted DB fetch or fallback to ANON
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const pagesContentService = {
  /**
   * Fetch a single page by its internal slug
   */
  async getPageBySlug(slug: string): Promise<PageDB | null> {
    const pages = await this.getAllPages();
    
    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
    } catch {}

    const { generateNativeSlug } = await import('@/lib/slug-generator');

    for (const page of pages) {
      if (!page.is_active) continue;

      // Match core slug "about"
      if (page.slug === decodedSlug) return page;

      // Match localized active translated titles "biz-kimiz"
      if (page.title) {
        for (const val of Object.values(page.title)) {
          if (val && generateNativeSlug(val) === decodedSlug) {
            return page;
          }
        }
      }
    }

    return null;
  },

  /**
   * Fetch all pages for Admin
   */
  async getAllPages(): Promise<PageDB[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all pages:", error);
      return [];
    }

    return data as PageDB[];
  },

  /**
   * Fetch a page by ID
   */
  async getPageById(id: string): Promise<PageDB | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching page by id ${id}:`, error);
      return null;
    }

    return data as PageDB;
  },

  /**
   * Create a new page
   */
  async createPage(page: Omit<PageDB, "id" | "created_at" | "updated_at">): Promise<PageDB | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("pages")
      .insert([page])
      .select()
      .single();

    if (error) {
      console.error("Error creating page:", error);
      return null;
    }

    return data as PageDB;
  },

  /**
   * Update an existing page
   */
  async updatePage(id: string, updates: Partial<PageDB>): Promise<PageDB | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("pages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating page ${id}:`, error);
      return null;
    }

    return data as PageDB;
  },

  /**
   * Delete a page by ID
   */
  async deletePage(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("pages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting page ${id}:`, error);
      return false;
    }

    return true;
  },

  /**
   * For the Header/Footer layout: given a locale, return an object mapping core DB slugs to their localized dynamic slugs and titles.
   */
  async getDynamicCoreNavData(locale: string): Promise<Record<string, { path: string; title: string | null }>> {
    const pages = await this.getAllPages();
    const { generateNativeSlug } = await import('@/lib/slug-generator');
    
    const navMap: Record<string, { path: string; title: string | null }> = {};

    for (const page of pages) {
      if (!page.is_active) continue;
      
      const locTitle = page.title?.[locale];
      if (locTitle) {
        navMap[page.slug] = {
          path: generateNativeSlug(locTitle),
          title: locTitle,
        };
      } else {
        navMap[page.slug] = {
          path: page.slug,
          title: page.title?.en || null,
        };
      }
    }

    return navMap;
  },
};
