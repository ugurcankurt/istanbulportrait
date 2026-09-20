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
   * Fetches the currently active discount campaigns from Supabase.
   * Returns an array of all active campaigns.
   */
  async getActiveDiscounts(): Promise<DiscountDB[]> {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("is_active", true);

      if (error) {
        console.error("Supabase Error fetching active discounts:", error);
        return [];
      }

      return (data || []) as DiscountDB[];
    } catch (e) {
      console.error("Unexpected error fetching active discounts:", e);
      return [];
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
