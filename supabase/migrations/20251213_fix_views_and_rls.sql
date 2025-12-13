-- Fix Security Definer Views and RLS Disabled in Public

-- 1. Fix Security Definer Views (Make them Security Invoker)
-- This ensures the view runs with the permissions of the user querying it, respecting their RLS policies.
ALTER VIEW public.blog_posts_with_translations SET (security_invoker = true);
ALTER VIEW public.customer_booking_summary SET (security_invoker = true);
ALTER VIEW public.admin_dashboard_stats SET (security_invoker = true);

-- 2. Secure 'documents' table (RLS)
-- Enable RLS to prevent unrestricted external access
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 3. Update match_documents to SECURITY DEFINER
-- Since we enabled RLS on 'documents' but added no policies (default deny),
-- normal users (anon) cannot read the table directly.
-- We must make the search function 'SECURITY DEFINER' so it runs as the owner (postgres)
-- and can read the table's embedding data to return search results.
-- NOTE: We also reiterate the fixed search_path from the previous migration for safety.
ALTER FUNCTION public.match_documents(vector, float, int) SECURITY DEFINER SET search_path = public, extensions;
