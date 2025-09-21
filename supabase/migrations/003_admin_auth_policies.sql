-- Admin authentication and RLS policies update
-- This migration adds admin-specific RLS policies for the admin panel

-- First, let's ensure we have the admin email configuration
-- You can set this via environment variable: NEXT_PUBLIC_ADMIN_EMAIL

-- Update RLS policies to allow admin access via service role
-- The admin panel uses supabaseAdmin client which has service_role access

-- Enhanced policy for bookings - allow service role full access
DROP POLICY IF EXISTS "Service role can update bookings" ON bookings;
CREATE POLICY "Service role full access to bookings" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

-- Enhanced policy for payments - service role already has access
-- No changes needed as it's already configured correctly

-- Enhanced policy for customers - service role already has access  
-- No changes needed as it's already configured correctly

-- Enhanced policy for packages - ensure service role can manage packages
CREATE POLICY "Service role can manage packages" ON packages
  FOR ALL USING (auth.role() = 'service_role');

-- Enhanced policy for rate_limits - ensure service role can manage
-- Already exists in 002_rate_limits_table.sql

-- Optional: Create admin_sessions table to track admin logins
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours')
);

-- Enable RLS for admin_sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_sessions - only service role can manage
CREATE POLICY "Service role can manage admin sessions" ON admin_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Create index for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);

-- Function to clean up expired admin sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < now();
END;
$$ language 'plpgsql';

-- Optional: Add trigger to automatically update admin session activity
CREATE OR REPLACE FUNCTION update_admin_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Extend session expiry on activity
    NEW.expires_at = now() + interval '24 hours';
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Comments for documentation
COMMENT ON TABLE admin_sessions IS 'Track admin panel login sessions';
COMMENT ON FUNCTION cleanup_expired_admin_sessions() IS 'Remove expired admin sessions';
COMMENT ON FUNCTION update_admin_session_activity() IS 'Extend admin session expiry on activity';

-- Create a view for admin dashboard statistics (optional optimization)
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM bookings) as total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed') as confirmed_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'cancelled') as cancelled_bookings,
  (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'confirmed') as total_revenue,
  (SELECT COALESCE(SUM(total_amount), 0) 
   FROM bookings 
   WHERE status = 'confirmed' 
     AND created_at >= date_trunc('month', now())
  ) as monthly_revenue,
  (SELECT COUNT(*) FROM customers) as total_customers,
  (SELECT COUNT(*) FROM payments) as total_payments,
  (SELECT COUNT(*) FROM payments WHERE status = 'success') as successful_payments,
  (SELECT COUNT(*) FROM payments WHERE status = 'failure') as failed_payments;

-- Grant access to the view for service role
GRANT SELECT ON admin_dashboard_stats TO service_role;

-- Note: Views cannot have RLS policies in PostgreSQL
-- The view inherits permissions from underlying tables
-- Service role already has access to all tables via existing policies