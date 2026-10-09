-- Add Google Ads tracking fields to bookings table

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS gbraid text,
ADD COLUMN IF NOT EXISTS wbraid text,
ADD COLUMN IF NOT EXISTS ip_address text;
