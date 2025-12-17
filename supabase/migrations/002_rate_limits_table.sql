-- Create rate_limits table for Supabase-based rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_window ON rate_limits(identifier, window_start);

-- Enable RLS (Row Level Security)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage rate limits
CREATE POLICY "Allow service role full access to rate_limits" ON rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add automatic cleanup function (optional)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM rate_limits 
    WHERE window_start < now() - interval '1 hour';
END;
$$ language 'plpgsql';

COMMENT ON TABLE rate_limits IS 'Rate limiting table for API endpoints';
COMMENT ON COLUMN rate_limits.identifier IS 'Unique identifier (IP address, user ID, etc.)';
COMMENT ON COLUMN rate_limits.count IS 'Number of requests within the current window';
COMMENT ON COLUMN rate_limits.window_start IS 'Start time of the rate limiting window';