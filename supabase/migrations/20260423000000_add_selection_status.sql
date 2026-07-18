-- Migration: Add selection_status to bookings table

-- Add the selection_status column to track if a user has completed their photo selection
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS selection_status VARCHAR DEFAULT 'pending';

-- Add a comment to describe the column
COMMENT ON COLUMN public.bookings.selection_status IS 'Tracks the status of the user''s photo selection from their gallery (pending, completed).';

-- You can also optionally add a selected_photos_count if you want to cache it, but status is enough for now.
