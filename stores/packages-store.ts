import { create } from "zustand";
import { packagesService, type PackageDB } from "@/lib/packages-service";
import { createClientSupabaseClient } from "@/lib/supabase/client";

interface PackagesState {
  packages: PackageDB[];
  loading: boolean;
  error: string | null;
  fetchPackages: () => Promise<void>;
  deletePackage: (id: string) => Promise<boolean>;
}

export const usePackagesStore = create<PackagesState>((set, get) => ({
  packages: [],
  loading: false,
  error: null,

  fetchPackages: async () => {
    set({ loading: true, error: null });
    try {
      const data = await packagesService.getAllPackages();
      set({ packages: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch packages", loading: false });
    }
  },

  deletePackage: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Direct deletion using client to preserve auth context if it's admin
      const supabase = createClientSupabaseClient();
      
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        packages: state.packages.filter((p) => p.id !== id),
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ error: error.message || "Failed to delete package", loading: false });
      return false;
    }
  },
}));
