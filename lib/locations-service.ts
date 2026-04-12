import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

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

export interface LocationDB {
  id: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  title: Record<string, string>;
  description: Record<string, string>;
  coordinates: { lat: number; lng: number };
  cover_image: string | null;
  gallery_images: string[];
  best_time: Record<string, string>;
  photography_tips: Record<string, string[]>;
  nearby_locations: string[];
  tags: string[];

  created_at?: string;
  updated_at?: string;
}

export class LocationsService {
  /**
   * Fetch all active locations (Client/Server safe)
   */
  async getLocations(): Promise<LocationDB[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching locations:", error);
      return [];
    }

    return (data as LocationDB[]) || [];
  }

  /**
   * Fetch all locations including inactive (Admin only)
   */
  async getAllLocationsAdmin(): Promise<LocationDB[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching all locations:", error);
      return [];
    }

    return (data as LocationDB[]) || [];
  }

  /**
   * Fetch a single location by its main internal slug or by native dynamic translated slug.
   */
  async getLocationBySlug(slug: string): Promise<LocationDB | null> {
    const locations = await this.getLocations();
    
    // Normalize incoming slug
    let decodedIncomingSlug = slug;
    try {
      decodedIncomingSlug = decodeURIComponent(slug).trim().toLowerCase();
    } catch {}

    const { generateNativeSlug } = await import('@/lib/slug-generator');

    for (const loc of locations) {
      if (loc.slug === decodedIncomingSlug) return loc;
      
      if (loc.title) {
        for (const val of Object.values(loc.title)) {
          if (val && generateNativeSlug(val) === decodedIncomingSlug) {
            return loc;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Fetch a single location by ID (Admin)
   */
  async getLocationById(id: string): Promise<LocationDB | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching location by ID ${id}:`, error);
      return null;
    }

    return data as LocationDB;
  }

  // Admin Mutations

  async createLocation(locationData: Partial<LocationDB>): Promise<LocationDB> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("locations")
      .insert([locationData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as LocationDB;
  }

  async updateLocation(id: string, locationData: Partial<LocationDB>): Promise<LocationDB> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("locations")
      .update({ ...locationData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as LocationDB;
  }

  async deleteLocation(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }
}

export const locationsService = new LocationsService();

// Cached Data Fetchers (To replace static queries)
export const getLocationsData = unstable_cache(
  async () => {
    return await locationsService.getLocations();
  },
  ["active-locations"],
  { revalidate: 3600, tags: ["locations"] }
);

export const getLocationBySlug = async (slug: string) => {
  return await locationsService.getLocationBySlug(slug);
};

export const getAllLocationSlugs = async () => {
  const locations = await locationsService.getLocations();
  return locations.map(l => l.slug);
};

export const getLocationsByTag = async (tag: string) => {
  const locations = await locationsService.getLocations();
  return locations.filter(loc => loc.tags.includes(tag));
};
