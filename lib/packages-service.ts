import { createClient } from "@supabase/supabase-js";

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
  title: PackageTranslations;
  description: PackageTranslations;
  features: PackageFeatures;
  duration: PackageTranslations;
  locations: number;

  created_at?: string;
  updated_at?: string;
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
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const packagesService = {
  /**
   * Fetch all active packages for public client 
   * Ordered by sort_order
   */
  async getActivePackages(): Promise<PackageDB[]> {
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

    return data as PackageDB[];
  },

  /**
   * Fetch all packages (including inactive) for Admin
   */
  async getAllPackages(): Promise<PackageDB[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching all packages:", error);
      return [];
    }

    return data as PackageDB[];
  },

  /**
   * Fetch a single package by its main internal slug or by native dynamic translated slug.
   */
  async getPackageBySlug(slug: string): Promise<PackageDB | null> {
    const packages = await this.getActivePackages();
    
    // Normalize incoming slug to handle URI encodings of native characters
    let decodedIncomingSlug = slug;
    try {
      decodedIncomingSlug = decodeURIComponent(slug).trim().toLowerCase();
    } catch {}

    const { generateNativeSlug } = await import('@/lib/slug-generator');

    for (const pkg of packages) {
      // Direct baseline hit
      if (pkg.slug === decodedIncomingSlug) return pkg;
      
      // Dynamic cross-locale hit
      if (pkg.title) {
        for (const val of Object.values(pkg.title)) {
          if (val && generateNativeSlug(val) === decodedIncomingSlug) {
            return pkg;
          }
        }
      }
    }
    
    return null;
  },

  /**
   * Fetch a package by ID
   */
  async getPackageById(id: string): Promise<PackageDB | null> {
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

    return data as PackageDB;
  },
  /**
   * Create a new package
   */
  async createPackage(pkg: Omit<PackageDB, "id" | "created_at" | "updated_at">): Promise<PackageDB | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("packages")
      .insert([pkg])
      .select()
      .single();

    if (error) {
      console.error("Error creating package. Message:", error.message, "Details:", error.details, "Hint:", error.hint, "Code:", error.code);
      console.error("Raw Error Object:", JSON.stringify(error, null, 2));
      return null;
    }

    return data as PackageDB;
  },

  /**
   * Update an existing package
   */
  async updatePackage(id: string, updates: Partial<PackageDB>): Promise<PackageDB | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("packages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating package ${id}. Message:`, error.message, "Details:", error.details, "Code:", error.code);
      console.error("Raw Error Object:", JSON.stringify(error, null, 2));
      return null;
    }

    return data as PackageDB;
  },

  /**
   * Delete a package by ID
   */
  async deletePackage(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting package ${id}:`, error);
      return false;
    }

    return true;
  },
};
