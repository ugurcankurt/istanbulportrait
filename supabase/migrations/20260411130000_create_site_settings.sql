-- Create site_settings table (singleton pattern)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    
    -- Contact Information
    contact_email text,
    contact_phone text,
    whatsapp_number text,
    
    -- Social Media Links
    instagram_url text,
    facebook_url text,
    youtube_url text,
    tiktok_url text,
    
    -- Assets (from Supabase Storage)
    logo_url text,
    logo_dark_url text,
    favicon_url text,

    -- Translatable JSON fields
    -- Expected format: {"en": "Address", "tr": "Adres"}
    address jsonb DEFAULT '{}'::jsonb,
    working_hours jsonb DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (essential for the website to fetch settings)
CREATE POLICY "Allow public select on site_settings" 
    ON public.site_settings FOR SELECT 
    USING (true);

-- Allow admin write access (service role bypasses RLS, but if they use an admin role, allow it)
-- Since we use supabaseAdmin with SUPABASE_SERVICE_KEY, RLS doesn't apply to updates, but just in case:
CREATE POLICY "Allow authenticated full access to site_settings" 
    ON public.site_settings FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Insert the default singleton row if it doesn't exist
INSERT INTO public.site_settings (
    id, 
    contact_email, 
    contact_phone, 
    whatsapp_number,
    instagram_url,
    facebook_url,
    address,
    working_hours
) VALUES (
    1, 
    'info@istanbulportrait.com', 
    '+905367093724', 
    '+905367093724',
    'https://instagram.com/istanbulportrait',
    'https://facebook.com/istanbulportrait',
    '{"en": "Eminönü, Istanbul, Turkey", "tr": "Eminönü, İstanbul, Türkiye"}'::jsonb,
    '{"en": "Everyday: 06:00 - 22:00", "tr": "Her gün: 06:00 - 22:00"}'::jsonb
) ON CONFLICT (id) DO NOTHING;
