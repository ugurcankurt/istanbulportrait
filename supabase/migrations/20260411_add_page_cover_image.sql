-- 1. Add cover_image to pages table (Safe to re-run, IF NOT EXISTS protects it)
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 2. Create the discrete 'pages' bucket as requested
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pages', 'pages', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Ensure appropriate read access to public bucket objects for all users
-- Policy names MUST be unique for the entire storage.objects table
CREATE POLICY "Pages Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pages');

-- 4. Ensure admin access to insert/delete objects in the bucket
CREATE POLICY "Pages Admin Upload Access" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'pages');

CREATE POLICY "Pages Admin Update Access" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'pages');

CREATE POLICY "Pages Admin Delete Access" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'pages');
