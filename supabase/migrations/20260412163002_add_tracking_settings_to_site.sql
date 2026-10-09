-- Add Tracking Settings into Site Settings
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS google_analytics_id text,
ADD COLUMN IF NOT EXISTS yandex_metrica_id text,
ADD COLUMN IF NOT EXISTS resend_api_key text,
ADD COLUMN IF NOT EXISTS custom_head_scripts text,
ADD COLUMN IF NOT EXISTS custom_body_scripts text;
