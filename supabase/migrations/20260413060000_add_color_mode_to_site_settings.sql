-- Add color_mode column to site_settings table to persist the Global Theme Mode
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS color_mode text DEFAULT 'system';
