-- Add new dynamic configuration columns to site_settings table
ALTER TABLE public.site_settings 
  -- Iyzico
  ADD COLUMN IF NOT EXISTS iyzico_base_url text,
  ADD COLUMN IF NOT EXISTS iyzico_api_key text,
  ADD COLUMN IF NOT EXISTS iyzico_secret_key text,

  -- Facebook & Meta
  ADD COLUMN IF NOT EXISTS facebook_pixel_id text,
  ADD COLUMN IF NOT EXISTS facebook_dataset_id text,
  ADD COLUMN IF NOT EXISTS facebook_access_token text,
  ADD COLUMN IF NOT EXISTS facebook_verify_token text,
  
  -- Instagram
  ADD COLUMN IF NOT EXISTS instagram_access_token text,
  ADD COLUMN IF NOT EXISTS instagram_account_id text,

  -- Google Analytics Server
  ADD COLUMN IF NOT EXISTS ga4_measurement_protocol_secret text,

  -- Core Application
  ADD COLUMN IF NOT EXISTS app_base_url text,
  ADD COLUMN IF NOT EXISTS admin_email text,

  -- Turinvoice
  ADD COLUMN IF NOT EXISTS turinvoice_base_url text,
  ADD COLUMN IF NOT EXISTS turinvoice_login text,
  ADD COLUMN IF NOT EXISTS turinvoice_password text,
  ADD COLUMN IF NOT EXISTS turinvoice_id_tsp text,
  ADD COLUMN IF NOT EXISTS turinvoice_secret_key text,
  ADD COLUMN IF NOT EXISTS turinvoice_callback_url text,

  -- Webmaster Keys
  ADD COLUMN IF NOT EXISTS clarity_project_id text,
  ADD COLUMN IF NOT EXISTS yandex_webmaster_key text,
  ADD COLUMN IF NOT EXISTS bing_webmaster_key text,
  ADD COLUMN IF NOT EXISTS indexnow_api_key text,

  -- Integrations
  ADD COLUMN IF NOT EXISTS behold_url text,
  ADD COLUMN IF NOT EXISTS prodigi_api_key text,
  ADD COLUMN IF NOT EXISTS prodigi_api_url text,
  ADD COLUMN IF NOT EXISTS google_ads_webhook_key text,
  ADD COLUMN IF NOT EXISTS featurable_widget_id text;
