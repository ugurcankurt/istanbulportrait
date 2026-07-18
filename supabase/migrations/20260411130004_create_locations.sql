-- Create locations table
CREATE TABLE public.locations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    title jsonb DEFAULT '{"en": ""}'::jsonb,
    description jsonb DEFAULT '{"en": ""}'::jsonb,
    coordinates jsonb DEFAULT '{"lat": 0, "lng": 0}'::jsonb,
    cover_image text,
    gallery_images text[] DEFAULT ARRAY[]::text[],
    best_time jsonb DEFAULT '{"en": ""}'::jsonb,
    photography_tips jsonb DEFAULT '{"en": []}'::jsonb,
    nearby_locations text[] DEFAULT ARRAY[]::text[],
    tags text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on locations"
ON public.locations FOR SELECT
USING (is_active = true);

-- Allow authenticated admins to do everything
CREATE POLICY "Allow authenticated full access on locations"
ON public.locations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create storage bucket for locations if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('locations', 'locations', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for locations bucket
CREATE POLICY "Locations Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'locations');

CREATE POLICY "Locations Admin Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'locations');

CREATE POLICY "Locations Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'locations');

CREATE POLICY "Locations Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'locations');
