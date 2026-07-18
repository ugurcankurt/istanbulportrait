import { createClient } from "@supabase/supabase-js";
import { createClientSupabaseClient } from "./supabase/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing required NEXT_PUBLIC_SUPABASE environment variables");
}

if (typeof window === "undefined" && !supabaseServiceKey) {
  console.warn("WARNING: SUPABASE_SERVICE_KEY is missing on the server.");
}

const globalForSupabase = globalThis as unknown as {
  supabase: any;
  supabaseAdmin: any;
};

export const supabase: any =
  globalForSupabase.supabase ??
  (typeof window !== "undefined"
    ? createClientSupabaseClient()
    : createClient<any>(supabaseUrl, supabaseAnonKey));

export const supabaseAdmin: any =
  globalForSupabase.supabaseAdmin ??
  (typeof window === "undefined" && supabaseServiceKey
    ? createClient<any>(supabaseUrl, supabaseServiceKey)
    : supabase);

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}

// Error types for better error handling
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export interface ApiError {
  error: string;
  details?: string;
  code?: number;
}

// Rate limiting types
export interface RateLimitRecord {
  id: string;
  identifier: string;
  count: number;
  window_start: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          package_id: string;
          user_name: string;
          user_email: string;
          user_phone: string;
          booking_date: string;
          booking_time: string;
          status: "draft" | "pending" | "confirmed" | "cancelled" | "completed";
          total_amount: number;
          notes?: string;
          locale?: string;
          abandoned_email_sent?: boolean;
          people_count?: number | null;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          user_name: string;
          user_email: string;
          user_phone: string;
          booking_date: string;
          booking_time: string;
          status?: "draft" | "pending" | "confirmed" | "cancelled" | "completed";
          total_amount: number;
          notes?: string;
          locale?: string;
          abandoned_email_sent?: boolean;
          people_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          package_id?: string;
          user_name?: string;
          user_email?: string;
          user_phone?: string;
          booking_date?: string;
          booking_time?: string;
          status?: "draft" | "pending" | "confirmed" | "cancelled" | "completed";
          total_amount?: number;
          notes?: string;
          locale?: string;
          abandoned_email_sent?: boolean;
          people_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          payment_id: string;
          conversation_id: string;
          status: "success" | "failure" | "pending";
          amount: number;
          currency: string;
          provider: string;
          provider_response?: Record<string, unknown>;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          payment_id: string;
          conversation_id: string;
          status?: "success" | "failure" | "pending";
          amount: number;
          currency?: string;
          provider?: string;
          provider_response?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          payment_id?: string;
          conversation_id?: string;
          status?: "success" | "failure" | "pending";
          amount?: number;
          currency?: string;
          provider?: string;
          provider_response?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      rate_limits: {
        Row: RateLimitRecord;
        Insert: {
          id?: string;
          identifier: string;
          count?: number;
          window_start?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          identifier?: string;
          count?: number;
          window_start?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      packages: {
        Row: {
          id: string;
          name: any; // JSONB with multilingual names
          description: any; // JSONB with multilingual descriptions
          price: number;
          duration: number; // integer in minutes
          features: any; // JSONB array
          is_popular: boolean;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: any;
          description: any;
          price: number;
          duration: number;
          features: any;
          is_popular?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: any;
          description?: any;
          price?: number;
          duration?: number;
          features?: any;
          is_popular?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      admin_dashboard_stats: {
        Row: {
          id?: string;
          total_bookings: number;
          pending_bookings: number;
          confirmed_bookings: number;
          cancelled_bookings: number;
          total_revenue: number;
          monthly_revenue: number;
          total_customers: number;
          total_payments: number;
          successful_payments: number;
          failed_payments: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_bookings: number;
          pending_bookings: number;
          confirmed_bookings: number;
          cancelled_bookings: number;
          total_revenue: number;
          monthly_revenue: number;
          total_customers: number;
          total_payments: number;
          successful_payments: number;
          failed_payments: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_bookings?: number;
          pending_bookings?: number;
          confirmed_bookings?: number;
          cancelled_bookings?: number;
          total_revenue?: number;
          monthly_revenue?: number;
          total_customers?: number;
          total_payments?: number;
          successful_payments?: number;
          failed_payments?: number;
          updated_at?: string;
        };
      };
      site_settings: {
          Row: {
            id: number;
            contact_email: string | null;
            contact_phone: string | null;
            whatsapp_number: string | null;
            instagram_url: string | null;
            facebook_url: string | null;
            youtube_url: string | null;
            tiktok_url: string | null;
            logo_url: string | null;
            logo_dark_url: string | null;
            favicon_url: string | null;
            address: any; // JSONB
            working_hours: any; // JSONB
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: number;
            contact_email?: string | null;
            contact_phone?: string | null;
            whatsapp_number?: string | null;
            instagram_url?: string | null;
            facebook_url?: string | null;
            youtube_url?: string | null;
            tiktok_url?: string | null;
            logo_url?: string | null;
            logo_dark_url?: string | null;
            favicon_url?: string | null;
            address?: any;
            working_hours?: any;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: number;
            contact_email?: string | null;
            contact_phone?: string | null;
            whatsapp_number?: string | null;
            instagram_url?: string | null;
            facebook_url?: string | null;
            youtube_url?: string | null;
            tiktok_url?: string | null;
            logo_url?: string | null;
            logo_dark_url?: string | null;
            favicon_url?: string | null;
            address?: any;
            working_hours?: any;
            created_at?: string;
            updated_at?: string;
          };
        };
      };
    };
  };
