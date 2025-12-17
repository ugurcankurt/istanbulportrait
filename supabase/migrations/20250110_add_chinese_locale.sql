-- =============================================
-- Istanbul Portrait - Add Chinese Locale Support
-- Created: 2025-01-10
-- Description: Adds 'zh' (Simplified Chinese) to blog system locale constraints
-- =============================================

-- Update blog_post_translations locale constraint
ALTER TABLE blog_post_translations
DROP CONSTRAINT IF EXISTS blog_post_translations_locale_check;

ALTER TABLE blog_post_translations
ADD CONSTRAINT blog_post_translations_locale_check
CHECK (locale IN ('en', 'ar', 'ru', 'es', 'zh'));

-- Update blog_category_translations locale constraint
ALTER TABLE blog_category_translations
DROP CONSTRAINT IF EXISTS blog_category_translations_locale_check;

ALTER TABLE blog_category_translations
ADD CONSTRAINT blog_category_translations_locale_check
CHECK (locale IN ('en', 'ar', 'ru', 'es', 'zh'));

-- Update blog_tag_translations locale constraint
ALTER TABLE blog_tag_translations
DROP CONSTRAINT IF EXISTS blog_tag_translations_locale_check;

ALTER TABLE blog_tag_translations
ADD CONSTRAINT blog_tag_translations_locale_check
CHECK (locale IN ('en', 'ar', 'ru', 'es', 'zh'));

-- =============================================
-- Add Chinese translations for existing categories
-- =============================================

-- Photography category
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT
  id,
  'zh',
  '摄影技巧',
  '摄影技巧、教程和灵感'
FROM blog_categories
WHERE slug = 'photography'
ON CONFLICT (category_id, locale) DO NOTHING;

-- Istanbul category
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT
  id,
  'zh',
  '伊斯坦布尔',
  '伊斯坦布尔的最佳拍摄地点和旅游指南'
FROM blog_categories
WHERE slug = 'istanbul'
ON CONFLICT (category_id, locale) DO NOTHING;

-- Travel category
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT
  id,
  'zh',
  '旅行',
  '旅行摄影技巧和目的地'
FROM blog_categories
WHERE slug = 'travel'
ON CONFLICT (category_id, locale) DO NOTHING;

-- Portrait category
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT
  id,
  'zh',
  '人像摄影',
  '人像摄影技巧和姿势'
FROM blog_categories
WHERE slug = 'portrait'
ON CONFLICT (category_id, locale) DO NOTHING;

-- Behind the Scenes category
INSERT INTO blog_category_translations (category_id, locale, name, description)
SELECT
  id,
  'zh',
  '幕后花絮',
  '摄影师的幕后故事'
FROM blog_categories
WHERE slug = 'behind-the-scenes'
ON CONFLICT (category_id, locale) DO NOTHING;

-- =============================================
-- Add Chinese translations for existing tags
-- =============================================

-- Tips tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '技巧'
FROM blog_tags WHERE slug = 'tips'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Tutorial tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '教程'
FROM blog_tags WHERE slug = 'tutorial'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Best Places tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '最佳地点'
FROM blog_tags WHERE slug = 'best-places'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Sunrise tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '日出'
FROM blog_tags WHERE slug = 'sunrise'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Sunset tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '日落'
FROM blog_tags WHERE slug = 'sunset'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Bosphorus tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '博斯普鲁斯海峡'
FROM blog_tags WHERE slug = 'bosphorus'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Historic Sites tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '历史遗迹'
FROM blog_tags WHERE slug = 'historic-sites'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Couple Photography tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '情侣摄影'
FROM blog_tags WHERE slug = 'couple-photography'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Posing tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '摆姿势'
FROM blog_tags WHERE slug = 'posing'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- Wedding tag
INSERT INTO blog_tag_translations (tag_id, locale, name)
SELECT id, 'zh', '婚礼'
FROM blog_tags WHERE slug = 'wedding'
ON CONFLICT (tag_id, locale) DO NOTHING;

-- =============================================
-- Create indexes for better query performance
-- =============================================

-- Create index on locale column for faster filtered queries
CREATE INDEX IF NOT EXISTS idx_blog_post_translations_locale
ON blog_post_translations(locale);

CREATE INDEX IF NOT EXISTS idx_blog_category_translations_locale
ON blog_category_translations(locale);

CREATE INDEX IF NOT EXISTS idx_blog_tag_translations_locale
ON blog_tag_translations(locale);

-- =============================================
-- Add comments for documentation
-- =============================================

COMMENT ON CONSTRAINT blog_post_translations_locale_check ON blog_post_translations
IS 'Supported locales: English (en), Arabic (ar), Russian (ru), Spanish (es), Chinese (zh)';

COMMENT ON CONSTRAINT blog_category_translations_locale_check ON blog_category_translations
IS 'Supported locales: English (en), Arabic (ar), Russian (ru), Spanish (es), Chinese (zh)';

COMMENT ON CONSTRAINT blog_tag_translations_locale_check ON blog_tag_translations
IS 'Supported locales: English (en), Arabic (ar), Russian (ru), Spanish (es), Chinese (zh)';
