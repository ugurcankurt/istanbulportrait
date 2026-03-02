-- =============================================
-- Istanbul Portrait - Add French, German, and Romanian Locale Support
-- Created: 2026-03-02
-- Description: Adds 'fr', 'de', and 'ro' to blog system locale constraints
-- =============================================

-- Update blog_post_translations locale constraint
ALTER TABLE blog_post_translations
DROP CONSTRAINT IF EXISTS blog_post_translations_locale_check;

ALTER TABLE blog_post_translations
ADD CONSTRAINT blog_post_translations_locale_check
CHECK (locale IN ('en', 'ar', 'ru', 'es', 'zh', 'fr', 'de', 'ro'));

-- Update blog_category_translations locale constraint
ALTER TABLE blog_category_translations
DROP CONSTRAINT IF EXISTS blog_category_translations_locale_check;

ALTER TABLE blog_category_translations
ADD CONSTRAINT blog_category_translations_locale_check
CHECK (locale IN ('en', 'ar', 'ru', 'es', 'zh', 'fr', 'de', 'ro'));

-- Update blog_tag_translations locale constraint
ALTER TABLE blog_tag_translations
DROP CONSTRAINT IF EXISTS blog_tag_translations_locale_check;

ALTER TABLE blog_tag_translations
ADD CONSTRAINT blog_tag_translations_locale_check
CHECK (locale IN ('en', 'ar', 'ru', 'es', 'zh', 'fr', 'de', 'ro'));

-- Create index on locale column for faster filtered queries if not already exists
CREATE INDEX IF NOT EXISTS idx_blog_post_translations_locale
ON blog_post_translations(locale);

CREATE INDEX IF NOT EXISTS idx_blog_category_translations_locale
ON blog_category_translations(locale);

CREATE INDEX IF NOT EXISTS idx_blog_tag_translations_locale
ON blog_tag_translations(locale);

-- Add comments for documentation
COMMENT ON CONSTRAINT blog_post_translations_locale_check ON blog_post_translations
IS 'Supported locales: English (en), Arabic (ar), Russian (ru), Spanish (es), Chinese (zh), French (fr), German (de), Romanian (ro)';

COMMENT ON CONSTRAINT blog_category_translations_locale_check ON blog_category_translations
IS 'Supported locales: English (en), Arabic (ar), Russian (ru), Spanish (es), Chinese (zh), French (fr), German (de), Romanian (ro)';

COMMENT ON CONSTRAINT blog_tag_translations_locale_check ON blog_tag_translations
IS 'Supported locales: English (en), Arabic (ar), Russian (ru), Spanish (es), Chinese (zh), French (fr), German (de), Romanian (ro)';
