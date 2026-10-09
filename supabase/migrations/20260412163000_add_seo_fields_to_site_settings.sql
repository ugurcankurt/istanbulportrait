-- Add missing SEO and Brand Identity fields into site_settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS site_name text,
ADD COLUMN IF NOT EXISTS site_description jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS default_og_image_url text,
ADD COLUMN IF NOT EXISTS organization_name text,
ADD COLUMN IF NOT EXISTS organization_founding_date text,
ADD COLUMN IF NOT EXISTS founder_name text,
ADD COLUMN IF NOT EXISTS founder_image_url text,
ADD COLUMN IF NOT EXISTS ai_search_config jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS gemini_api_key text;
