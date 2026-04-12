import { supabase } from "./supabase";

export interface DiscountDB {
  id: string;
  name: string;
  discount_percentage: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export const discountService = {
  /**
   * Fetches the currently active discount campaign from Supabase.
   * Returns null if no active campaign is running.
   */
  async getActiveDiscount(): Promise<DiscountDB | null> {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // PGRST116 = JSON object requested, multiple (or no) rows returned
          // It's perfectly normal to have no rows if there's no active discount
          return null;
        }
        console.error("Supabase Error fetching active discount:", error);
        return null;
      }

      return data as DiscountDB;
    } catch (e) {
      console.error("Unexpected error fetching active discount:", e);
      return null;
    }
  },

  /**
   * Admin Function: Fetches all discounts including inactive ones.
   */
  async getAllDiscounts(): Promise<DiscountDB[]> {
    const { data, error } = await supabase
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all discounts:", error);
      return [];
    }

    return data as DiscountDB[];
  },
};
