-- Add 'draft' to the check constraint for bookings status if it exists, or just ensure the column accepts it
-- Since we can't easily modify an existing check constraint in one line without dropping it, we'll try to just update the column definition if possible, 
-- or simply add the new columns which is safer.
-- We assume status is a text column with a check constraint.

ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('draft', 'pending', 'confirmed', 'cancelled', 'completed'));

-- Add locale column for email language (default to en)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS locale text DEFAULT 'en';

-- Add flag to track if abandoned cart email has been sent
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS abandoned_email_sent boolean DEFAULT false;

-- Create an index to speed up the cron job query
CREATE INDEX IF NOT EXISTS idx_bookings_abandoned_recovery 
ON bookings (status, created_at, abandoned_email_sent);
