-- Security Hardening Migration
-- Fixes Supabase Linters: function_search_path_mutable, extension_in_public

-- 1. Create 'extensions' schema and move 'vector' extension
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on proper roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move vector extension (preserves data)
ALTER EXTENSION vector SET SCHEMA extensions;

-- 2. Secure Functions by setting fixed search_path
-- For 'match_documents', we need 'extensions' in path for the vector operators
ALTER FUNCTION public.match_documents SET search_path = public, extensions;

-- For other functions, restricted to 'public' is usually sufficient
ALTER FUNCTION public.update_admin_session_activity SET search_path = public;
ALTER FUNCTION public.cleanup_old_rate_limits SET search_path = public;
ALTER FUNCTION public.process_affiliate_referral SET search_path = public;
ALTER FUNCTION public.cleanup_expired_admin_sessions SET search_path = public;
ALTER FUNCTION public.cleanup_old_consent_logs SET search_path = public;
ALTER FUNCTION public.update_route_locations_count SET search_path = public;
ALTER FUNCTION public.calculate_commission SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;

-- Optional: Add 'extensions' to the database default search path so raw queries don't fail
-- ALTER DATABASE postgres SET search_path TO public, extensions;
