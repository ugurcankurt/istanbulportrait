-- 1. Add handle_updated_at triggers to all missing tables
DROP TRIGGER IF EXISTS set_pages_updated_at ON public.pages;
CREATE TRIGGER set_pages_updated_at
    BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_blog_authors_updated_at ON public.blog_authors;
CREATE TRIGGER set_blog_authors_updated_at
    BEFORE UPDATE ON public.blog_authors
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER set_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_blog_post_translations_updated_at ON public.blog_post_translations;
CREATE TRIGGER set_blog_post_translations_updated_at
    BEFORE UPDATE ON public.blog_post_translations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_blog_categories_updated_at ON public.blog_categories;
CREATE TRIGGER set_blog_categories_updated_at
    BEFORE UPDATE ON public.blog_categories
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_blog_category_translations_updated_at ON public.blog_category_translations;
CREATE TRIGGER set_blog_category_translations_updated_at
    BEFORE UPDATE ON public.blog_category_translations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_blog_tags_updated_at ON public.blog_tags;
CREATE TRIGGER set_blog_tags_updated_at
    BEFORE UPDATE ON public.blog_tags
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS set_blog_tag_translations_updated_at ON public.blog_tag_translations;
CREATE TRIGGER set_blog_tag_translations_updated_at
    BEFORE UPDATE ON public.blog_tag_translations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. Add performance indexes on junction tables
CREATE INDEX IF NOT EXISTS idx_blog_post_categories_category_id ON public.blog_post_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON public.blog_post_tags(tag_id);

-- 3. Update RLS Policies to allow authenticated admins full access
CREATE POLICY "Allow authenticated full access to blog_authors" ON public.blog_authors FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to blog_posts" ON public.blog_posts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to blog_post_translations" ON public.blog_post_translations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to blog_categories" ON public.blog_categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to blog_category_translations" ON public.blog_category_translations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to blog_tags" ON public.blog_tags FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to blog_tag_translations" ON public.blog_tag_translations FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to blog_post_categories" ON public.blog_post_categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated full access to blog_post_tags" ON public.blog_post_tags FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. Move meta_keywords to blog_post_translations
ALTER TABLE public.blog_post_translations ADD COLUMN IF NOT EXISTS meta_keywords JSONB DEFAULT '[]'::jsonb;

-- 5. Add auth.users foreign key to blog_authors
ALTER TABLE public.blog_authors
    DROP CONSTRAINT IF EXISTS blog_authors_user_id_fkey,
    ADD CONSTRAINT blog_authors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
