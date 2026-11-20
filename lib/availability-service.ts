import { supabase } from "./supabase";
import { supabaseAuth } from "./supabase/client";

function getReadClient() {
  return typeof window === "undefined" ? supabase : supabaseAuth;
}

function getWriteClient() {
  return supabaseAuth;
}

export interface AvailabilitySettings {
  id: string;
  start_time: string;
  end_time: string;
}

export interface BlockedSlot {
  id: string;
  date: string;
  time: string | null;
  reason: string | null;
  created_at: string;
}

export interface TimeSurcharge {
  id: string;
  time: string;
  surcharge_percentage: number;
  created_at: string;
}

export const availabilityService = {
  async getSettings(): Promise<AvailabilitySettings> {
    const client = getReadClient();
    const { data, error } = await client
      .from("availability_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found, return defaults
        return { id: "default", start_time: "06:00", end_time: "20:00" };
      }
      throw error;
    }
    return data;
  },

  async updateSettings(startTime: string, endTime: string): Promise<void> {
    const client = getWriteClient();
    const { error } = await client
      .from("availability_settings")
      .upsert({ id: "default", start_time: startTime, end_time: endTime });

    if (error) throw error;
  },

  async getBlockedSlots(): Promise<BlockedSlot[]> {
    const client = getReadClient();
    const { data, error } = await client
      .from("blocked_slots")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addBlockedSlot(
    date: string,
    time: string | null,
    reason: string | null,
  ): Promise<void> {
    const client = getWriteClient();
    const { error } = await client
      .from("blocked_slots")
      .insert({ date, time, reason });

    if (error) throw error;
  },

  async deleteBlockedSlot(id: string): Promise<void> {
    const client = getWriteClient();
    const { error } = await client.from("blocked_slots").delete().eq("id", id);

    if (error) throw error;
  },

  async getTimeSurcharges(): Promise<TimeSurcharge[]> {
    const client = getReadClient();
    const { data, error } = await client
      .from("time_surcharges")
      .select("*")
      .order("time", { ascending: true });

    if (error) {
      if (typeof window === "undefined") {
        console.error("Failed fetching time_surcharges on server:", error);
        return [];
      }
      throw error;
    }
    return data || [];
  },

  async addTimeSurcharge(time: string, percentage: number): Promise<void> {
    const client = getWriteClient();
    const { error } = await client
      .from("time_surcharges")
      .insert({ time, surcharge_percentage: percentage });

    if (error) throw error;
  },

  async deleteTimeSurcharge(id: string): Promise<void> {
    const client = getWriteClient();
    const { error } = await client
      .from("time_surcharges")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
