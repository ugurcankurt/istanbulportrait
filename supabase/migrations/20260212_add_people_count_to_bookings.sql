-- Add people_count column to bookings table for per-person pricing (rooftop package)
-- Migration: 20260212_add_people_count_to_bookings

-- Add people_count column (nullable, only required for rooftop package)
ALTER TABLE bookings ADD COLUMN people_count INTEGER;

-- Add check constraint: people_count must be between 1 and 10 for rooftop package
ALTER TABLE bookings ADD CONSTRAINT check_people_count 
  CHECK (
    (package_id != 'rooftop') OR 
    (people_count IS NOT NULL AND people_count >= 1 AND people_count <= 10)
  );

-- Add comment to explain the column
COMMENT ON COLUMN bookings.people_count IS 'Number of people for per-person pricing (rooftop package only). Required for rooftop, nullable for other packages.';

-- Add index for potential queries filtering by people count
CREATE INDEX IF NOT EXISTS idx_bookings_people_count ON bookings(people_count) WHERE people_count IS NOT NULL;
