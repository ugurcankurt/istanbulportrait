-- Create addons table
CREATE TABLE IF NOT EXISTS public.addons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title JSONB NOT NULL DEFAULT '{}'::jsonb,
    description JSONB NOT NULL DEFAULT '{}'::jsonb,
    price NUMERIC NOT NULL,
    is_per_person BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS execution for addons
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to addons"
    ON public.addons FOR SELECT
    USING (true);

CREATE POLICY "Allow admins full access to addons"
    ON public.addons FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create package_addons join table
CREATE TABLE IF NOT EXISTS public.package_addons (
    package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES public.addons(id) ON DELETE CASCADE,
    PRIMARY KEY (package_id, addon_id)
);

-- RLS for package_addons
ALTER TABLE public.package_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to package_addons"
    ON public.package_addons FOR SELECT
    USING (true);

CREATE POLICY "Allow admins full access to package_addons"
    ON public.package_addons FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add selected_addons to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;
