-- Create pages table for dynamic CMS content
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title JSONB NOT NULL DEFAULT '{}'::jsonb,
    subtitle JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS execution for pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY "Allow public read access to pages"
    ON public.pages FOR SELECT
    USING (true);

-- Allow full access to authenticated admins
CREATE POLICY "Allow admins full access to pages"
    ON public.pages FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
