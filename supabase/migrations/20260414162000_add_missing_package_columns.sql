-- Add missing columns to packages table
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS is_per_person BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locations INTEGER DEFAULT 1;

-- Note: Depending on your Supabase permissions and setup, 
-- you may need to reload the schema cache from the Supabase dashboard 
-- (Database -> API Settings -> Reload schema cache) or run:
-- NOTIFY pgrst, 'reload schema';
