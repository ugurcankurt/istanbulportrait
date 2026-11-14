import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import {
  CORE_PAGE_LOCALIZED_SLUGS,
  LEGACY_CORE_PAGE_SLUGS,
} from "@/lib/core-page-slugs";
import { toStorageProxyPath } from "@/lib/seo-utils";
import { generateNativeSlug } from "@/lib/slug-generator";
import { fetchWithRetry } from "@/lib/supabase-fetch";

export { CORE_PAGE_LOCALIZED_SLUGS, LEGACY_CORE_PAGE_SLUGS };

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

let serverSupabaseClient: any = null;

const getSupabaseClient = () => {
  if (typeof window !== "undefined") {
    // In Browser: use the initialized auth client which holds the Admin Session
    const { supabaseAuth } = require("@/lib/supabase/client");
    return supabaseAuth;
  }

  // On Server: use Service Role for unrestricted DB fetch or fallback to ANON
  if (!serverSupabaseClient) {
    serverSupabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false },
        global: { fetch: fetchWithRetry },
      },
    );
  }
  return serverSupabaseClient;
};

const NON_LATIN_LOCALES = new Set(["ar", "ru", "zh"]);

function normalizeCoreSlugVariant(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ıİ]/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ä/g, "a")
    .replace(/ß/g, "ss")
    .replace(/[ăâ]/g, "a")
    .replace(/î/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[àáâãå]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõ]/g, "o")
    .replace(/[ùúû]/g, "u")
    .replace(/ñ/g, "n")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesCoreSlugVariant(candidate: string, incoming: string): boolean {
  const cleanCandidate = generateNativeSlug(candidate);
  if (!cleanCandidate) return false;
  if (cleanCandidate === incoming) return true;

  const asciiCandidate = normalizeCoreSlugVariant(cleanCandidate);
  const asciiIncoming = normalizeCoreSlugVariant(incoming);
  if (asciiCandidate === asciiIncoming) return true;

  // Handle German umlaut transliteration alternation (ue <-> u, oe <-> o, ae <-> a)
  if (asciiCandidate === "ueber-uns" && asciiIncoming === "uber-uns") {
    return true;
  }

  return false;
}

/**
 * Resolves the canonical clean URL segment for a core page (`packages`, `locations`, `blog`, `about`, `contact`, `privacy`)
 * using DB `content.localized_slug[locale]`, falling back to `CORE_PAGE_LOCALIZED_SLUGS`, and finally the internal slug.
 */
export function getCorePageSegment(
  pageOrSlug: PageDB | string | null | undefined,
  locale: string,
): string {
  if (!pageOrSlug) return "";

  if (typeof pageOrSlug === "string") {
    return CORE_PAGE_LOCALIZED_SLUGS[pageOrSlug]?.[locale] || pageOrSlug;
  }

  const dbLocalized = pageOrSlug.content?.localized_slug?.[locale];
  if (typeof dbLocalized === "string" && dbLocalized.trim()) {
    const trimmed = dbLocalized.trim();
    if (NON_LATIN_LOCALES.has(locale) && /^[a-z0-9-]+$/i.test(trimmed)) {
      return (
        CORE_PAGE_LOCALIZED_SLUGS[pageOrSlug.slug]?.[locale] || pageOrSlug.slug
      );
    }
    return generateNativeSlug(trimmed);
  }

  return (
    CORE_PAGE_LOCALIZED_SLUGS[pageOrSlug.slug]?.[locale] || pageOrSlug.slug
  );
}

export const pagesContentService = {
  getCorePageSegment,

  /**
   * Fetch a single page by its internal slug, localized core slug, or legacy title slug
   */
  async getPageBySlug(slug: string): Promise<PageDB | null> {
    const pages = await this.getAllPages();

    let decodedSlug = slug;
    try {
      decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
    } catch {}

    for (const page of pages) {
      if (!page.is_active) {
        continue;
      }

      // Match exact internal slug (including "home-instagram", "home-reviews", "about", etc.)
      if (page.slug === decodedSlug) return page;

      // Skip "home" and "home-*" internal section rows when matching translated URL titles
      if (page.slug === "home" || page.slug.startsWith("home-")) {
        continue;
      }

      // Match explicit DB localized_slug map
      const localizedSlugMap = page.content?.localized_slug;
      if (localizedSlugMap && typeof localizedSlugMap === "object") {
        for (const val of Object.values(localizedSlugMap)) {
          if (
            typeof val === "string" &&
            matchesCoreSlugVariant(val, decodedSlug)
          ) {
            return page;
          }
        }
      }

      // Match static CORE_PAGE_LOCALIZED_SLUGS map
      const staticSlugs = CORE_PAGE_LOCALIZED_SLUGS[page.slug];
      if (staticSlugs) {
        for (const val of Object.values(staticSlugs)) {
          if (matchesCoreSlugVariant(val, decodedSlug)) {
            return page;
          }
        }
      }

      // Match legacy core page slugs (e.g., old Romanized Latin slugs) so they resolve and 308 redirect
      const legacySlugs = LEGACY_CORE_PAGE_SLUGS[page.slug];
      if (legacySlugs) {
        for (const val of legacySlugs) {
          if (matchesCoreSlugVariant(val, decodedSlug)) {
            return page;
          }
        }
      }

      // Match legacy H1/title-derived slugs so old long URLs resolve and 308 redirect cleanly
      if (page.title) {
        for (const val of Object.values(page.title)) {
          if (val && matchesCoreSlugVariant(val, decodedSlug)) {
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
  getAllPages: unstable_cache(
    async (): Promise<PageDB[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Notice fetching all pages:", error.message || error);
        return [];
      }

      return (data as PageDB[]).map((page) => ({
        ...page,
        cover_image: page.cover_image
          ? toStorageProxyPath(page.cover_image)
          : page.cover_image,
      }));
    },
    ["pages", "all-pages"],
    { tags: ["pages"], revalidate: 60 },
  ),

  /**
   * Fetch a page by ID
   */
  getPageById: unstable_cache(
    async (id: string): Promise<PageDB | null> => {
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
    ["pages", "page-by-id"],
    { tags: ["pages"], revalidate: 60 },
  ),

  /**
   * Create a new page
   */
  async createPage(
    page: Omit<PageDB, "id" | "created_at" | "updated_at">,
  ): Promise<PageDB | null> {
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
  async updatePage(
    id: string,
    updates: Partial<PageDB>,
  ): Promise<PageDB | null> {
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
    const { error } = await supabase.from("pages").delete().eq("id", id);

    if (error) {
      console.error(`Error deleting page ${id}:`, error);
      return false;
    }

    return true;
  },

  /**
   * For the Header/Footer layout: given a locale, return an object mapping core DB slugs to their localized dynamic slugs and titles.
   */
  async getDynamicCoreNavData(
    locale: string,
  ): Promise<
    Record<
      string,
      { path: string; title: string | null; navTitle?: string | null }
    >
  > {
    const pages = await this.getAllPages();

    const navMap: Record<
      string,
      { path: string; title: string | null; navTitle?: string | null }
    > = {};

    for (const page of pages) {
      if (!page.is_active) continue;

      const locTitle = page.title?.[locale];
      const customNavTitle = page.content?.nav_title?.[locale] || null;
      const cleanPath = getCorePageSegment(page, locale) || page.slug;

      navMap[page.slug] = {
        path: cleanPath,
        title: locTitle || page.title?.en || null,
        navTitle: customNavTitle,
      };
    }

    return navMap;
  },
};
