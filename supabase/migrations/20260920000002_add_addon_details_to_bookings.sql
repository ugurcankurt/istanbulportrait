-- Add selected_addon_details column to bookings for denormalized addon display
-- This preserves addon name/price even if addon is later deleted
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS selected_addon_details JSONB DEFAULT '[]'::jsonb;
