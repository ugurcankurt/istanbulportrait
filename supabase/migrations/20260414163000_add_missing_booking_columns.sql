-- Add missing people_count column to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS people_count INTEGER DEFAULT 1;

-- Reload schema cache to apply changes to API
NOTIFY pgrst, 'reload schema';
