-- Create packages table
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    cover_image TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    title JSONB NOT NULL DEFAULT '{}'::jsonb,
    description JSONB NOT NULL DEFAULT '{}'::jsonb,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    duration JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS execution for packages
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow public read access to packages"
    ON public.packages FOR SELECT
    USING (true);

-- Allow full access to authenticated admins (using existing auth flow)
CREATE POLICY "Allow admins full access to packages"
    ON public.packages FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create storage bucket for packages if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('packages', 'packages', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the packages bucket
CREATE POLICY "Public Read Access Packages Bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'packages');

CREATE POLICY "Admin Insert Packages Bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'packages');

CREATE POLICY "Admin Update Packages Bucket"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'packages');

CREATE POLICY "Admin Delete Packages Bucket"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'packages');
