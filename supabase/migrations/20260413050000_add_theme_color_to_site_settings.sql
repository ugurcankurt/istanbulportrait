-- Add theme_color column to site_settings table to persist the global UI theme
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT 'violet';
