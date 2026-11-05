-- =============================================================================
-- Migration: 20261105000000_security_rls_and_booking_metadata.sql
-- Purpose:
--   1. Add missing payment_metadata JSONB column on public.bookings (fixes
--      PGRST204 in /api/cron/drive-notifications).
--   2. Ensure public.time_surcharges table exists in migrations.
--   3. Define public.is_admin() SECURITY DEFINER helper so RLS policies
--      distinguish between admin accounts and regular Customer Portal users.
--   4. Lock down RLS policies on bookings, customers, payments, site_settings,
--      packages, addons, discounts, pages, locations, availability, blog, and
--      storage buckets.
--   5. Revoke direct anon/authenticated SELECT on secret API key columns in
--      public.site_settings.
-- =============================================================================

-- 1. Add missing payment_metadata column to public.bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure time_surcharges table exists
CREATE TABLE IF NOT EXISTS public.time_surcharges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time TEXT NOT NULL UNIQUE,
  surcharge_percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.time_surcharges ENABLE ROW LEVEL SECURITY;

-- 3. Define public.is_admin() helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    lower(auth.jwt() ->> 'email') IN (
      'info@istanbulportrait.com',
      'ugurcankurt@gmail.com',
      lower(COALESCE((SELECT admin_email FROM public.site_settings WHERE id = 1 LIMIT 1), ''))
    ),
    false
  );
$$;

-- 4. Lock down bookings, customers, and payments RLS policies
DROP POLICY IF EXISTS "Public Read Own Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin All Access Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public Insert Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can read own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins have full access to bookings" ON public.bookings;

CREATE POLICY "Customers can read own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(user_email) = lower(auth.jwt() ->> 'email')
    OR public.is_admin()
  );

CREATE POLICY "Admins have full access to bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin All Access Customers" ON public.customers;
DROP POLICY IF EXISTS "Public Insert Customers" ON public.customers;
DROP POLICY IF EXISTS "Customers can read own customer record" ON public.customers;
DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;

CREATE POLICY "Customers can read own customer record"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR lower(email) = lower(auth.jwt() ->> 'email')
    OR public.is_admin()
  );

CREATE POLICY "Admins have full access to customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin All Access Payments" ON public.payments;
DROP POLICY IF EXISTS "Public Insert Payments" ON public.payments;
DROP POLICY IF EXISTS "Customers can read own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins have full access to payments" ON public.payments;

CREATE POLICY "Customers can read own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = payments.booking_id
        AND (
          b.user_id = auth.uid()
          OR lower(b.user_email) = lower(auth.jwt() ->> 'email')
        )
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins have full access to payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Lock down site_settings write access and revoke secret column SELECT from anon/authenticated
DROP POLICY IF EXISTS "Allow authenticated full access to site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins full access to site_settings" ON public.site_settings;

CREATE POLICY "Allow admins full access to site_settings"
  ON public.site_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DO $$ BEGIN
  REVOKE SELECT (
    resend_api_key,
    resend_audience_id,
    gemini_api_key,
    facebook_access_token,
    facebook_verify_token,
    instagram_access_token,
    ga4_measurement_protocol_secret,
    indexnow_api_key,
    google_ads_webhook_key,
    custom_head_scripts,
    custom_body_scripts,
    admin_email
  ) ON public.site_settings FROM anon, authenticated;
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- 6. Lock down admin write policies on catalog, content, and availability tables
DROP POLICY IF EXISTS "Allow admins full access to packages" ON public.packages;
CREATE POLICY "Allow admins full access to packages"
  ON public.packages
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full access to addons" ON public.addons;
CREATE POLICY "Allow admins full access to addons"
  ON public.addons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full access to package_addons" ON public.package_addons;
CREATE POLICY "Allow admins full access to package_addons"
  ON public.package_addons
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full access to discounts" ON public.discounts;
CREATE POLICY "Allow admins full access to discounts"
  ON public.discounts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admins full access to pages" ON public.pages;
CREATE POLICY "Allow admins full access to pages"
  ON public.pages
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access on locations" ON public.locations;
CREATE POLICY "Allow authenticated full access on locations"
  ON public.locations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin All Access Availability Settings" ON public.availability_settings;
CREATE POLICY "Admin All Access Availability Settings"
  ON public.availability_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin All Access Blocked Slots" ON public.blocked_slots;
CREATE POLICY "Admin All Access Blocked Slots"
  ON public.blocked_slots
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public Read Time Surcharges" ON public.time_surcharges;
CREATE POLICY "Public Read Time Surcharges"
  ON public.time_surcharges
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin All Access Time Surcharges" ON public.time_surcharges;
CREATE POLICY "Admin All Access Time Surcharges"
  ON public.time_surcharges
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Lock down blog tables write policies to admins only
DROP POLICY IF EXISTS "Allow authenticated full access to blog_authors" ON public.blog_authors;
CREATE POLICY "Allow authenticated full access to blog_authors"
  ON public.blog_authors
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access to blog_posts" ON public.blog_posts;
CREATE POLICY "Allow authenticated full access to blog_posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access to blog_post_translations" ON public.blog_post_translations;
CREATE POLICY "Allow authenticated full access to blog_post_translations"
  ON public.blog_post_translations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access to blog_categories" ON public.blog_categories;
CREATE POLICY "Allow authenticated full access to blog_categories"
  ON public.blog_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access to blog_category_translations" ON public.blog_category_translations;
CREATE POLICY "Allow authenticated full access to blog_category_translations"
  ON public.blog_category_translations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access to blog_tags" ON public.blog_tags;
CREATE POLICY "Allow authenticated full access to blog_tags"
  ON public.blog_tags
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access to blog_tag_translations" ON public.blog_tag_translations;
CREATE POLICY "Allow authenticated full access to blog_tag_translations"
  ON public.blog_tag_translations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access to blog_post_categories" ON public.blog_post_categories;
CREATE POLICY "Allow authenticated full access to blog_post_categories"
  ON public.blog_post_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated full access to blog_post_tags" ON public.blog_post_tags;
CREATE POLICY "Allow authenticated full access to blog_post_tags"
  ON public.blog_post_tags
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Lock down storage bucket write policies to admins only
DROP POLICY IF EXISTS "Admin Insert Packages Bucket" ON storage.objects;
CREATE POLICY "Admin Insert Packages Bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'packages' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Update Packages Bucket" ON storage.objects;
CREATE POLICY "Admin Update Packages Bucket"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'packages' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Packages Bucket" ON storage.objects;
CREATE POLICY "Admin Delete Packages Bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'packages' AND public.is_admin());

DROP POLICY IF EXISTS "Locations Admin Upload Access" ON storage.objects;
CREATE POLICY "Locations Admin Upload Access"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'locations' AND public.is_admin());

DROP POLICY IF EXISTS "Locations Admin Update Access" ON storage.objects;
CREATE POLICY "Locations Admin Update Access"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'locations' AND public.is_admin());

DROP POLICY IF EXISTS "Locations Admin Delete Access" ON storage.objects;
CREATE POLICY "Locations Admin Delete Access"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'locations' AND public.is_admin());

DROP POLICY IF EXISTS "Pages Admin Upload Access" ON storage.objects;
CREATE POLICY "Pages Admin Upload Access"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pages' AND public.is_admin());

DROP POLICY IF EXISTS "Pages Admin Update Access" ON storage.objects;
CREATE POLICY "Pages Admin Update Access"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'pages' AND public.is_admin());

DROP POLICY IF EXISTS "Pages Admin Delete Access" ON storage.objects;
CREATE POLICY "Pages Admin Delete Access"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'pages' AND public.is_admin());

NOTIFY pgrst, 'reload schema';

