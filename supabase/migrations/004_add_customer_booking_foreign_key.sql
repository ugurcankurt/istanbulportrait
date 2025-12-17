-- Add foreign key relationship between customers and bookings
-- This migration establishes the missing relationship that enables Supabase joins

-- Step 1: Ensure all booking emails have corresponding customer records
-- Insert missing customers based on booking data
INSERT INTO customers (name, email, phone, created_at, updated_at)
SELECT DISTINCT 
  user_name as name,
  user_email as email,
  user_phone as phone,
  MIN(created_at) as created_at, -- Use earliest booking date as customer creation
  NOW() as updated_at
FROM bookings 
WHERE user_email NOT IN (SELECT email FROM customers)
  AND user_email IS NOT NULL 
  AND user_email != ''
GROUP BY user_name, user_email, user_phone
ON CONFLICT (email) DO NOTHING; -- Skip if email already exists

-- Step 2: Clean up any invalid emails in bookings (optional safety check)
-- Update empty or null emails to a placeholder if any exist
UPDATE bookings 
SET user_email = 'unknown@placeholder.com'
WHERE user_email IS NULL OR user_email = '';

-- Step 3: Add the foreign key constraint
-- This enables Supabase to understand the relationship for joins
ALTER TABLE bookings 
ADD CONSTRAINT bookings_user_email_fkey 
FOREIGN KEY (user_email) REFERENCES customers(email) 
ON UPDATE CASCADE ON DELETE RESTRICT;

-- Step 4: Create indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_customers_email_lookup ON customers(email);

-- Step 5: Add comments for documentation
COMMENT ON CONSTRAINT bookings_user_email_fkey ON bookings 
IS 'Foreign key relationship enabling customer-booking joins in Supabase';

-- Step 6: Update RLS policies if needed (customers table already has proper policies)
-- The existing policies should work fine with the new foreign key

-- Step 7: Grant necessary permissions for the relationship
-- Service role already has full access, so no additional grants needed

-- Optional: Create a view for easy customer-booking queries
CREATE OR REPLACE VIEW customer_booking_summary AS
SELECT 
  c.id as customer_id,
  c.name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  c.created_at as customer_since,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
  COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN b.total_amount END), 0) as total_spent,
  MAX(b.created_at) as last_booking_date
FROM customers c
LEFT JOIN bookings b ON c.email = b.user_email
GROUP BY c.id, c.name, c.email, c.phone, c.created_at;

-- Grant access to the view
GRANT SELECT ON customer_booking_summary TO service_role;

-- Final verification query (for debugging)
-- SELECT COUNT(*) as total_customers FROM customers;
-- SELECT COUNT(*) as total_bookings FROM bookings;
-- SELECT COUNT(*) as orphan_bookings FROM bookings b 
-- WHERE b.user_email NOT IN (SELECT email FROM customers);