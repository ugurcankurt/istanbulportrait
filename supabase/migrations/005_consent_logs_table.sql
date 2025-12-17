-- =============================================
-- Consent Logs Table for GDPR Compliance
-- Created: 2025-01-19
-- Description: Tracks user consent events for audit trail
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create consent_logs table
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_identifier TEXT NOT NULL, -- Hashed IP or session ID for privacy
  consent_choice TEXT NOT NULL CHECK (consent_choice IN ('accepted_all', 'essential_only')),
  consent_version TEXT DEFAULT '1.0', -- Track consent policy version
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT, -- Browser user agent string
  ip_address TEXT, -- Hashed IP address
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_consent_logs_timestamp ON consent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consent_logs_identifier ON consent_logs(user_identifier);
CREATE INDEX IF NOT EXISTS idx_consent_logs_choice ON consent_logs(consent_choice);

-- Enable RLS (Row Level Security)
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (admin access only)
CREATE POLICY "Service role can manage consent logs" ON consent_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE consent_logs IS 'GDPR compliance: Audit trail of user consent events';
COMMENT ON COLUMN consent_logs.user_identifier IS 'SHA-256 hashed identifier (IP or session) for privacy';
COMMENT ON COLUMN consent_logs.consent_choice IS 'User consent choice: accepted_all or essential_only';
COMMENT ON COLUMN consent_logs.consent_version IS 'Version of consent policy at time of consent';
COMMENT ON COLUMN consent_logs.ip_address IS 'SHA-256 hashed IP address for audit purposes';

-- Optional: Create function to clean up old logs (keep last 2 years for GDPR)
CREATE OR REPLACE FUNCTION cleanup_old_consent_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM consent_logs 
    WHERE timestamp < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_consent_logs() IS 'Remove consent logs older than 2 years (GDPR retention limit)';
