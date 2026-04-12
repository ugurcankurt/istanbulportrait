-- 1. Add content to pages table (Safe to re-run, IF NOT EXISTS protects it)
-- The content column effectively stores modular component data like FAQs without polluting rows
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;
