import { createBrowserClient } from "@supabase/ssr";

type SupabaseClient = ReturnType<typeof createBrowserClient>;

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

export const availabilityService = {
  async getSettings(): Promise<AvailabilitySettings> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("availability_settings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, return defaults
        return { id: "default", start_time: "06:00", end_time: "20:00" };
      }
      throw error;
    }
    return data;
  },

  async updateSettings(startTime: string, endTime: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("availability_settings")
      .upsert({ id: "default", start_time: startTime, end_time: endTime });

    if (error) throw error;
  },

  async getBlockedSlots(): Promise<BlockedSlot[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("blocked_slots")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addBlockedSlot(date: string, time: string | null, reason: string | null): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("blocked_slots")
      .insert({ date, time, reason });

    if (error) throw error;
  },

  async deleteBlockedSlot(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("blocked_slots")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
};
