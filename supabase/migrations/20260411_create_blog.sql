-- Blog System Schema Definition
-- Run this in your Supabase SQL Editor

-- 1. Create Blog Authors Table
CREATE TABLE IF NOT EXISTS public.blog_authors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name TEXT NOT NULL,
    bio JSONB DEFAULT '{}'::jsonb,
    avatar_url TEXT,
    role JSONB DEFAULT '{}'::jsonb,
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    featured_image TEXT,
    author_id UUID REFERENCES public.blog_authors(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    views_count INTEGER NOT NULL DEFAULT 0,
    reading_time_minutes INTEGER NOT NULL DEFAULT 0,
    meta_keywords JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Blog Post Translations Table
CREATE TABLE IF NOT EXISTS public.blog_post_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    meta_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, locale),
    UNIQUE(slug, locale)
);

-- 4. Create Blog Categories Table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT NOT NULL DEFAULT '#000000',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Blog Category Translations Table
CREATE TABLE IF NOT EXISTS public.blog_category_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, locale)
);

-- 6. Create Blog Tags Table
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create Blog Tag Translations Table
CREATE TABLE IF NOT EXISTS public.blog_tag_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    locale TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tag_id, locale)
);

-- 8. Create Blog Post to Categories Junction Table
CREATE TABLE IF NOT EXISTS public.blog_post_categories (
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, category_id)
);

-- 9. Create Blog Post to Tags Junction Table
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (post_id, tag_id)
);

-- Turn on RLS for all tables but allow public reads and authenticated inserts/updates
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tag_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow everything for simplicity since it's an admin dashboard controlled by service keys)
-- If using anonymous keys from frontend, setup read-only access:
CREATE POLICY "Enable read access for all users" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.blog_post_translations FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.blog_category_translations FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.blog_tag_translations FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.blog_post_categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.blog_authors FOR SELECT USING (true);

-- End of File
