import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { toStorageProxyPath } from "@/lib/seo-utils";
import { fetchWithRetry } from "@/lib/supabase-fetch";

function normalizeAsciiPackageSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[ıİ]/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Types matching our Supabase schema
export interface PackageTranslations {
  en: string;
  ar?: string;
  ru?: string;
  es?: string;
  zh?: string;
  de?: string;
  fr?: string;
  ro?: string;
  [key: string]: string | undefined;
}

export interface PackageFeatures {
  en: string[];
  [key: string]: string[] | undefined;
}

export interface PackageDB {
  id: string;
  slug: string;
  price: number;
  original_price: number | null;
  is_active: boolean;
  is_per_person: boolean;
  is_popular: boolean;
  sort_order: number;
  cover_image: string | null;
  gallery_images: string[];
  video_url: string | null;
  title: PackageTranslations;
  description: PackageTranslations;
  meta_description: PackageTranslations;
  features: PackageFeatures;
  meta_keywords: PackageFeatures;
  duration: PackageTranslations;
  locations: number;

  addon_ids?: string[]; // Array of associated addon IDs

  created_at?: string;
  updated_at?: string;
}

let serverSupabaseClient: any = null;

// Ensure the client uses the right keys (either server or client boundary depending on usage)
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

export const packagesService = {
  /**
   * Fetch all active packages for public client
   * Ordered by sort_order
   */
  getActivePackages: cache(async (): Promise<PackageDB[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching packages:", error);
      return [];
    }

    return (data as PackageDB[]).map((pkg) => ({
      ...pkg,
      cover_image: pkg.cover_image
        ? toStorageProxyPath(pkg.cover_image)
        : pkg.cover_image,
      gallery_images: Array.isArray(pkg.gallery_images)
        ? pkg.gallery_images.map((img) => toStorageProxyPath(img))
        : pkg.gallery_images,
      video_url: pkg.video_url
        ? toStorageProxyPath(pkg.video_url)
        : pkg.video_url,
    }));
  }),

  /**
   * Fetch all packages (including inactive) for Admin
   */
  getAllPackages: cache(async (): Promise<PackageDB[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching all packages:", error);
      return [];
    }

    return (data as PackageDB[]).map((pkg) => ({
      ...pkg,
      cover_image: pkg.cover_image
        ? toStorageProxyPath(pkg.cover_image)
        : pkg.cover_image,
      gallery_images: Array.isArray(pkg.gallery_images)
        ? pkg.gallery_images.map((img) => toStorageProxyPath(img))
        : pkg.gallery_images,
      video_url: pkg.video_url
        ? toStorageProxyPath(pkg.video_url)
        : pkg.video_url,
    }));
  }),

  /**
   * Fetch a single package by its main internal slug or by native dynamic translated slug.
   */
  getPackageBySlug: cache(async (slug: string): Promise<PackageDB | null> => {
    const packages = await packagesService.getActivePackages();

    // Normalize incoming slug to handle URI encodings of native characters
    let decodedIncomingSlug = slug;
    try {
      decodedIncomingSlug = decodeURIComponent(slug).trim().toLowerCase();
    } catch {}

    const { generateNativeSlug } = await import("@/lib/slug-generator");
    const asciiIncomingSlug = normalizeAsciiPackageSlug(decodedIncomingSlug);

    for (const pkg of packages) {
      // Direct baseline hit
      if (pkg.slug === decodedIncomingSlug) return pkg;
      if (normalizeAsciiPackageSlug(pkg.slug) === asciiIncomingSlug) return pkg;

      // Dynamic cross-locale hit
      if (pkg.title) {
        for (const val of Object.values(pkg.title)) {
          if (!val) continue;
          const nativeSlug = generateNativeSlug(val);
          if (
            nativeSlug === decodedIncomingSlug ||
            normalizeAsciiPackageSlug(nativeSlug) === asciiIncomingSlug
          ) {
            return pkg;
          }
        }
      }
    }

    return null;
  }),

  /**
   * Fetch a package by ID
   */
  getPackageById: cache(async (id: string): Promise<PackageDB | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching package by id ${id}:`, error);
      return null;
    }

    // Fetch addon_ids
    const { data: addonsData } = await supabase
      .from("package_addons")
      .select("addon_id")
      .eq("package_id", id);

    const packageWithAddons = {
      ...data,
      addon_ids: addonsData?.map((a: any) => a.addon_id) || [],
    } as PackageDB;

    return packageWithAddons;
  }),
  /**
   * Create a new package
   */
  async createPackage(
    pkg: Omit<PackageDB, "id" | "created_at" | "updated_at">,
  ): Promise<PackageDB | null> {
    const supabase = getSupabaseClient();
    const { addon_ids, ...pkgData } = pkg;

    const { data, error } = await supabase
      .from("packages")
      .insert([pkgData])
      .select()
      .single();

    if (error) {
      console.error(
        "Error creating package. Message:",
        error.message,
        "Details:",
        error.details,
        "Hint:",
        error.hint,
        "Code:",
        error.code,
      );
      console.error("Raw Error Object:", JSON.stringify(error, null, 2));
      return null;
    }

    if (addon_ids && addon_ids.length > 0) {
      const addonInserts = addon_ids.map((addon_id) => ({
        package_id: data.id,
        addon_id,
      }));
      await supabase.from("package_addons").insert(addonInserts);
    }

    return { ...data, addon_ids: addon_ids || [] } as PackageDB;
  },

  /**
   * Update an existing package
   */
  async updatePackage(
    id: string,
    updates: Partial<PackageDB>,
  ): Promise<PackageDB | null> {
    const supabase = getSupabaseClient();
    const { addon_ids, ...pkgData } = updates;

    const { data, error } = await supabase
      .from("packages")
      .update(pkgData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(
        `Error updating package ${id}. Message:`,
        error.message,
        "Details:",
        error.details,
        "Code:",
        error.code,
      );
      console.error("Raw Error Object:", JSON.stringify(error, null, 2));
      return null;
    }

    if (addon_ids !== undefined) {
      await supabase.from("package_addons").delete().eq("package_id", id);
      if (addon_ids.length > 0) {
        const addonInserts = addon_ids.map((addon_id) => ({
          package_id: id,
          addon_id,
        }));
        await supabase.from("package_addons").insert(addonInserts);
      }
    }

    return { ...data, addon_ids: addon_ids || [] } as PackageDB;
  },

  /**
   * Delete a package by ID
   */
  async deletePackage(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("packages").delete().eq("id", id);

    if (error) {
      console.error(`Error deleting package ${id}:`, error);
      return false;
    }

    return true;
  },
};
