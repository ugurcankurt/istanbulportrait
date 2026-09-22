-- Add Google Ads conversion label fields to site_settings
-- These replace the misused google_ads_webhook_key field for conversion tracking

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS google_ads_purchase_label       TEXT,
  ADD COLUMN IF NOT EXISTS google_ads_lead_label           TEXT,
  ADD COLUMN IF NOT EXISTS google_ads_begin_checkout_label TEXT,
  ADD COLUMN IF NOT EXISTS google_ads_developer_token      TEXT,
  ADD COLUMN IF NOT EXISTS google_ads_customer_id          TEXT;
