-- Add Google Ads gclid tracking field to bookings table

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS gclid text;
