import { supabase } from "./supabase";

export interface PromoCodeDB {
  id: string;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const promoService = {
  /**
   * Validates a promo code. Returns the promo code object if valid, or null if invalid/expired/exhausted.
   */
  async validate(code: string): Promise<PromoCodeDB | null> {
    if (!code || !code.trim()) return null;

    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        return null; // Not found or inactive
      }

      const promo = data as PromoCodeDB;

      // Check usage limits
      if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
        return null;
      }

      // Check date limits
      const now = new Date();
      if (promo.start_date) {
        const start = new Date(promo.start_date);
        start.setHours(0, 0, 0, 0);
        if (now.getTime() < start.getTime()) return null;
      }
      if (promo.end_date) {
        const end = new Date(promo.end_date);
        end.setHours(23, 59, 59, 999);
        if (now.getTime() > end.getTime()) return null;
      }

      return promo;
    } catch (e) {
      console.error("Error validating promo code:", e);
      return null;
    }
  },

  /**
   * Increments the usage counter for a promo code. Called by the backend when a booking is confirmed.
   * NOTE: This should technically be done using a secure Supabase RPC function (increment)
   * to avoid race conditions. But for simplicity we use normal update here or you can use
   * an RPC if available.
   */
  async incrementUsage(code: string): Promise<boolean> {
    try {
      // 1. Fetch current counter
      const { data, error } = await supabase
        .from("promo_codes")
        .select("id, current_uses")
        .eq("code", code.trim().toUpperCase())
        .single();

      if (error || !data) return false;

      // 2. Increment
      const { error: updateError } = await supabase
        .from("promo_codes")
        .update({ current_uses: data.current_uses + 1 })
        .eq("id", data.id);

      if (updateError) return false;
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Admin Function: Fetches all promo codes
   */
  async getAllPromoCodes(): Promise<PromoCodeDB[]> {
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching promo codes:", error);
      return [];
    }
    return data as PromoCodeDB[];
  }
};
