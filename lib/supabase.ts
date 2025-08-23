import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          package_id: string
          user_name: string
          user_email: string
          user_phone: string
          booking_date: string
          booking_time: string
          status: 'pending' | 'confirmed' | 'cancelled'
          total_amount: number
          notes?: string
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          user_name: string
          user_email: string
          user_phone: string
          booking_date: string
          booking_time: string
          status?: 'pending' | 'confirmed' | 'cancelled'
          total_amount: number
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          user_name?: string
          user_email?: string
          user_phone?: string
          booking_date?: string
          booking_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled'
          total_amount?: number
          notes?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          payment_id: string
          conversation_id: string
          status: 'success' | 'failure' | 'pending'
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          payment_id: string
          conversation_id: string
          status?: 'success' | 'failure' | 'pending'
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          payment_id?: string
          conversation_id?: string
          status?: 'success' | 'failure' | 'pending'
          amount?: number
          created_at?: string
        }
      }
    }
  }
}