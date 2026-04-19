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

      if (error) {
        console.error("Supabase Error fetching active discount:", error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const now = new Date();
      // Filter the active discount based on date constraints
      const validDiscount = data.find((discount: any) => {
        let isValid = true;
        if (discount.start_date) {
            const start = new Date(discount.start_date);
            start.setHours(0, 0, 0, 0);
            if (now.getTime() < start.getTime()) isValid = false;
        }
        if (discount.end_date) {
            const end = new Date(discount.end_date);
            end.setHours(23, 59, 59, 999);
            if (now.getTime() > end.getTime()) isValid = false;
        }
        return isValid;
      });

      return validDiscount || null;
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
