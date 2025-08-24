import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Missing required Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
          status: "pending" | "confirmed" | "cancelled";
          total_amount: number;
          notes?: string;
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
          status?: "pending" | "confirmed" | "cancelled";
          total_amount: number;
          notes?: string;
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
          status?: "pending" | "confirmed" | "cancelled";
          total_amount?: number;
          notes?: string;
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
          name: string;
          price: number;
          duration: string;
          features: string[];
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          duration: string;
          features: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          duration?: string;
          features?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
