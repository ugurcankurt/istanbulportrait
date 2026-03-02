-- =============================================
-- Istanbul Portrait - Blog System Migration
-- Created: 2025-01-04
-- Description: Creates tables for SEO-friendly multilingual blog system
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- BLOG POSTS (Main Table)
-- =============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,
  meta_keywords TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE
);

-- =============================================
-- BLOG POST TRANSLATIONS (i18n Content)
-- =============================================
CREATE TABLE IF NOT EXISTS blog_post_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'ar', 'ru', 'es')),
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, locale)
);

-- =============================================
-- BLOG CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_category_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'ar', 'ru', 'es')),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, locale)
);

-- =============================================
-- BLOG POST - CATEGORY RELATIONS (Many-to-Many)
-- =============================================
CREATE TABLE IF NOT EXISTS blog_post_categories (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, category_id)
);

-- =============================================
-- BLOG TAGS
-- =============================================
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_tag_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE NOT NULL,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'ar', 'ru', 'es')),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tag_id, locale)
);

-- =============================================
-- BLOG POST - TAG RELATIONS (Many-to-Many)
-- =============================================
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

-- =============================================
-- INDEXES for Performance Optimization
-- =============================================

-- Blog Posts Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_views ON blog_posts(views_count DESC);

-- Blog Post Translations Indexes
CREATE INDEX IF NOT EXISTS idx_blog_translations_locale ON blog_post_translations(locale);
CREATE INDEX IF NOT EXISTS idx_blog_translations_post ON blog_post_translations(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_translations_post_locale ON blog_post_translations(post_id, locale);

-- Category Indexes
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_category_translations_locale ON blog_category_translations(locale);
CREATE INDEX IF NOT EXISTS idx_blog_post_categories_post ON blog_post_categories(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_categories_category ON blog_post_categories(category_id);

-- Tag Indexes
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tag_translations_locale ON blog_tag_translations(locale);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- =============================================
-- TRIGGERS for Updated_at
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to blog_posts
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to blog_post_translations
DROP TRIGGER IF EXISTS update_blog_translations_updated_at ON blog_post_translations;
CREATE TRIGGER update_blog_translations_updated_at
  BEFORE UPDATE ON blog_post_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to blog_categories
DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to blog_category_translations
DROP TRIGGER IF EXISTS update_blog_category_translations_updated_at ON blog_category_translations;
CREATE TRIGGER update_blog_category_translations_updated_at
  BEFORE UPDATE ON blog_category_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tag_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Public Read Access (for published posts)
CREATE POLICY "Public can view published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Public can view blog translations"
  ON blog_post_translations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM blog_posts WHERE id = post_id AND status = 'published'
  ));

CREATE POLICY "Public can view categories"
  ON blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Public can view category translations"
  ON blog_category_translations FOR SELECT
  USING (true);

CREATE POLICY "Public can view post categories"
  ON blog_post_categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM blog_posts WHERE id = post_id AND status = 'published'
  ));

CREATE POLICY "Public can view tags"
  ON blog_tags FOR SELECT
  USING (true);

CREATE POLICY "Public can view tag translations"
  ON blog_tag_translations FOR SELECT
  USING (true);

CREATE POLICY "Public can view post tags"
  ON blog_post_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM blog_posts WHERE id = post_id AND status = 'published'
  ));

-- Admin Full Access (will be managed through service role in backend)
-- Note: Admin operations will use supabaseAdmin (service key) which bypasses RLS

-- =============================================
-- SEED DATA (Sample Categories and Tags)
-- =============================================

-- Insert sample categories
INSERT INTO blog_categories (slug, icon, color, sort_order) VALUES
  ('photography-tips', '📸', '#6366f1', 1),
  ('istanbul-guide', '🏛️', '#ec4899', 2),
  ('behind-the-scenes', '🎬', '#f59e0b', 3),
  ('travel', '✈️', '#10b981', 4),
  ('tutorials', '📚', '#8b5cf6', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert category translations (English)
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT id, 'en',
  CASE slug
    WHEN 'photography-tips' THEN 'Photography Tips'
    WHEN 'istanbul-guide' THEN 'Istanbul Guide'
    WHEN 'behind-the-scenes' THEN 'Behind the Scenes'
    WHEN 'travel' THEN 'Travel'
    WHEN 'tutorials' THEN 'Tutorials'
  END,
  CASE slug
    WHEN 'photography-tips' THEN 'Professional photography tips and techniques'
    WHEN 'istanbul-guide' THEN 'Best places to visit and photograph in Istanbul'
    WHEN 'behind-the-scenes' THEN 'Behind the scenes of our photo sessions'
    WHEN 'travel' THEN 'Travel photography and destination guides'
    WHEN 'tutorials' THEN 'Step-by-step photography tutorials'
  END
FROM blog_categories
ON CONFLICT (category_id, locale) DO NOTHING;

-- Insert category translations (Arabic)
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT id, 'ar',
  CASE slug
    WHEN 'photography-tips' THEN 'نصائح التصوير'
    WHEN 'istanbul-guide' THEN 'دليل اسطنبول'
    WHEN 'behind-the-scenes' THEN 'خلف الكواليس'
    WHEN 'travel' THEN 'السفر'
    WHEN 'tutorials' THEN 'دروس'
  END,
  CASE slug
    WHEN 'photography-tips' THEN 'نصائح وتقنيات التصوير الاحترافي'
    WHEN 'istanbul-guide' THEN 'أفضل الأماكن للزيارة والتصوير في اسطنبول'
    WHEN 'behind-the-scenes' THEN 'خلف الكواليس لجلسات التصوير'
    WHEN 'travel' THEN 'تصوير السفر وأدلة الوجهات'
    WHEN 'tutorials' THEN 'دروس التصوير خطوة بخطوة'
  END
FROM blog_categories
ON CONFLICT (category_id, locale) DO NOTHING;

-- Insert category translations (Russian)
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT id, 'ru',
  CASE slug
    WHEN 'photography-tips' THEN 'Советы по фотографии'
    WHEN 'istanbul-guide' THEN 'Путеводитель по Стамбулу'
    WHEN 'behind-the-scenes' THEN 'За кадром'
    WHEN 'travel' THEN 'Путешествия'
    WHEN 'tutorials' THEN 'Уроки'
  END,
  CASE slug
    WHEN 'photography-tips' THEN 'Профессиональные советы и техники фотографии'
    WHEN 'istanbul-guide' THEN 'Лучшие места для посещения и фотосъемки в Стамбуле'
    WHEN 'behind-the-scenes' THEN 'За кадром наших фотосессий'
    WHEN 'travel' THEN 'Фотография путешествий и путеводители'
    WHEN 'tutorials' THEN 'Пошаговые уроки фотографии'
  END
FROM blog_categories
ON CONFLICT (category_id, locale) DO NOTHING;

-- Insert category translations (Spanish)
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT id, 'es',
  CASE slug
    WHEN 'photography-tips' THEN 'Consejos de fotografía'
    WHEN 'istanbul-guide' THEN 'Guía de Estambul'
    WHEN 'behind-the-scenes' THEN 'Detrás de las escenas'
    WHEN 'travel' THEN 'Viajes'
    WHEN 'tutorials' THEN 'Tutoriales'
  END,
  CASE slug
    WHEN 'photography-tips' THEN 'Consejos y técnicas de fotografía profesional'
    WHEN 'istanbul-guide' THEN 'Mejores lugares para visitar y fotografiar en Estambul'
    WHEN 'behind-the-scenes' THEN 'Detrás de las escenas de nuestras sesiones fotográficas'
    WHEN 'travel' THEN 'Fotografía de viajes y guías de destinos'
    WHEN 'tutorials' THEN 'Tutoriales de fotografía paso a paso'
  END
FROM blog_categories
ON CONFLICT (category_id, locale) DO NOTHING;

-- Insert sample tags
INSERT INTO blog_tags (slug) VALUES
  ('portrait'),
  ('landscape'),
  ('bosphorus'),
  ('galata-tower'),
  ('sultanahmet'),
  ('blue-mosque'),
  ('hagia-sophia'),
  ('street-photography'),
  ('golden-hour'),
  ('editing-tips')
ON CONFLICT (slug) DO NOTHING;

-- Insert tag translations (English)
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'en',
  CASE slug
    WHEN 'portrait' THEN 'Portrait'
    WHEN 'landscape' THEN 'Landscape'
    WHEN 'bosphorus' THEN 'Bosphorus'
    WHEN 'galata-tower' THEN 'Galata Tower'
    WHEN 'sultanahmet' THEN 'Sultanahmet'
    WHEN 'blue-mosque' THEN 'Blue Mosque'
    WHEN 'hagia-sophia' THEN 'Hagia Sophia'
    WHEN 'street-photography' THEN 'Street Photography'
    WHEN 'golden-hour' THEN 'Golden Hour'
    WHEN 'editing-tips' THEN 'Editing Tips'
  END
FROM blog_tags
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Insert tag translations for other locales (ar, ru, es)
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'ar',
  CASE slug
    WHEN 'portrait' THEN 'صورة شخصية'
    WHEN 'landscape' THEN 'منظر طبيعي'
    WHEN 'bosphorus' THEN 'البوسفور'
    WHEN 'galata-tower' THEN 'برج غلطة'
    WHEN 'sultanahmet' THEN 'السلطان أحمد'
    WHEN 'blue-mosque' THEN 'المسجد الأزرق'
    WHEN 'hagia-sophia' THEN 'آيا صوفيا'
    WHEN 'street-photography' THEN 'تصوير الشارع'
    WHEN 'golden-hour' THEN 'الساعة الذهبية'
    WHEN 'editing-tips' THEN 'نصائح التحرير'
  END
FROM blog_tags
ON CONFLICT (tag_id, locale) DO NOTHING;

-- =============================================
-- COMMENTS (Future Enhancement - Optional)
-- =============================================
-- Uncomment if you want to add comments functionality later
/*
CREATE TABLE IF NOT EXISTS blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status);
*/

-- =============================================
-- VIEWS for Easier Querying
-- =============================================

-- View: Published posts with all translations
CREATE OR REPLACE VIEW blog_posts_with_translations AS
SELECT
  p.id,
  p.slug,
  p.status,
  p.featured_image,
  p.author_id,
  p.published_at,
  p.created_at,
  p.updated_at,
  p.views_count,
  p.reading_time_minutes,
  p.meta_keywords,
  p.is_featured,
  jsonb_object_agg(
    t.locale,
    jsonb_build_object(
      'title', t.title,
      'excerpt', t.excerpt,
      'content', t.content,
      'meta_description', t.meta_description
    )
  ) as translations
FROM blog_posts p
LEFT JOIN blog_post_translations t ON p.id = t.post_id
GROUP BY p.id;

-- Migration completed successfully
-- Run this file with: supabase migration up
-- Or manually execute in Supabase SQL Editor
