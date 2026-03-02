/**
 * Blog Service
 * Database operations for blog system using Supabase
 */

import { supabaseAdmin } from "@/lib/supabase";
import type {
  BlogCategoryListResponse,
  BlogCategoryWithTranslation,
  BlogPost,
  BlogPostListResponse,
  BlogPostWithAllTranslations,
  BlogPostWithRelations,
  BlogQueryParams,
  BlogTagListResponse,
  BlogTagWithTranslation,
  CategoryFormData,
  Locale,
  TagFormData,
} from "@/types/blog";
import { calculateReadingTime } from "./blog-utils";

// =============================================
// BLOG POSTS
// =============================================

/**
 * Get published blog posts (public)
 */
export async function getPublishedBlogPosts(
  params: BlogQueryParams,
): Promise<BlogPostListResponse> {
  const {
    page = 1,
    limit = 20,
    search = "",
    category_id,
    tag_id,
    locale = "en",
    is_featured,
    sort_by = "published_at",
    sort_order = "desc",
  } = params;

  let query = supabaseAdmin
    .from("blog_posts")
    .select(
      `
      *,
      translation:blog_post_translations!inner(
        id,
        title,
        excerpt,
        content,
        meta_description,
        locale
      ),
      categories:blog_post_categories(
        category:blog_categories(
          id,
          slug,
          icon,
          color,
          translations:blog_category_translations(name, description, locale)
        )
      ),
      tags:blog_post_tags(
        tag:blog_tags(
          id,
          slug,
          translations:blog_tag_translations(name, locale)
        )
      )
    `,
      { count: "exact" },
    )
    .eq("status", "published")
    .eq("translation.locale", locale)
    .not("published_at", "is", null);

  // Apply filters
  if (search) {
    query = query.ilike("translation.title", `%${search}%`);
  }

  if (category_id && category_id !== "all") {
    query = query.contains("categories", [{ category_id }]);
  }

  if (tag_id && tag_id !== "all") {
    query = query.contains("tags", [{ tag_id }]);
  }

  if (typeof is_featured === "boolean") {
    query = query.eq("is_featured", is_featured);
  }

  // Sorting
  query = query.order(sort_by, { ascending: sort_order === "asc" });

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching blog posts:", error);
    throw new Error("Failed to fetch blog posts");
  }

  // Transform array translations to objects and filter by locale
  const transformedPosts = (data || []).map((post: any) => ({
    ...post,
    translation: Array.isArray(post.translation)
      ? post.translation[0]
      : post.translation,
    categories: (post.categories || []).map((cat: any) => ({
      ...cat,
      category: {
        ...cat.category,
        translation: Array.isArray(cat.category.translations)
          ? cat.category.translations.find((t: any) => t.locale === locale) ||
          cat.category.translations[0]
          : cat.category.translations,
      },
    })),
    tags: (post.tags || []).map((tag: any) => ({
      ...tag,
      tag: {
        ...tag.tag,
        translation: Array.isArray(tag.tag.translations)
          ? tag.tag.translations.find((t: any) => t.locale === locale) ||
          tag.tag.translations[0]
          : tag.tag.translations,
      },
    })),
  }));

  return {
    posts: transformedPosts as unknown as BlogPostWithRelations[],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get all blog posts (admin)
 */
export async function getAllBlogPosts(
  params: BlogQueryParams,
): Promise<BlogPostListResponse> {
  const {
    page = 1,
    limit = 20,
    search = "",
    status = "all",
    category_id,
    tag_id,
    locale = "en",
    is_featured,
    sort_by = "created_at",
    sort_order = "desc",
  } = params;

  let query = supabaseAdmin
    .from("blog_posts")
    .select(
      `
      *,
      translation:blog_post_translations!inner(
        id,
        title,
        excerpt,
        content,
        meta_description,
        locale
      ),
      categories:blog_post_categories(
        category:blog_categories(
          id,
          slug,
          icon,
          color,
          translations:blog_category_translations(name, description, locale)
        )
      ),
      tags:blog_post_tags(
        tag:blog_tags(
          id,
          slug,
          translations:blog_tag_translations(name, locale)
        )
      )
    `,
      { count: "exact" },
    )
    .eq("translation.locale", locale);

  // Apply filters
  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `translation.title.ilike.%${search}%,slug.ilike.%${search}%`,
    );
  }

  if (category_id && category_id !== "all") {
    query = query.contains("categories", [{ category_id }]);
  }

  if (tag_id && tag_id !== "all") {
    query = query.contains("tags", [{ tag_id }]);
  }

  if (typeof is_featured === "boolean") {
    query = query.eq("is_featured", is_featured);
  }

  // Sorting
  query = query.order(sort_by, { ascending: sort_order === "asc" });

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching all blog posts:", error);
    throw new Error("Failed to fetch blog posts");
  }

  // Transform array translations to objects and filter by locale
  const transformedPosts = (data || []).map((post: any) => ({
    ...post,
    translation: Array.isArray(post.translation)
      ? post.translation[0]
      : post.translation,
    categories: (post.categories || []).map((cat: any) => ({
      ...cat,
      category: {
        ...cat.category,
        translation: Array.isArray(cat.category.translations)
          ? cat.category.translations.find((t: any) => t.locale === locale) ||
          cat.category.translations[0]
          : cat.category.translations,
      },
    })),
    tags: (post.tags || []).map((tag: any) => ({
      ...tag,
      tag: {
        ...tag.tag,
        translation: Array.isArray(tag.tag.translations)
          ? tag.tag.translations.find((t: any) => t.locale === locale) ||
          tag.tag.translations[0]
          : tag.tag.translations,
      },
    })),
  }));

  return {
    posts: transformedPosts as unknown as BlogPostWithRelations[],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string,
  locale: Locale = "en",
): Promise<BlogPostWithRelations | null> {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select(
      `
      *,
      translation:blog_post_translations!inner(
        id,
        title,
        excerpt,
        content,
        meta_description,
        locale
      ),
      categories:blog_post_categories(
        category:blog_categories(
          id,
          slug,
          icon,
          color,
          translations:blog_category_translations(name, description, locale)
        )
      ),
      tags:blog_post_tags(
        tag:blog_tags(
          id,
          slug,
          translations:blog_tag_translations(name, locale)
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("translation.locale", locale)
    .single();

  if (error) {
    console.error("Error fetching blog post by slug:", error);
    return null;
  }

  // Transform array translations to objects and filter by locale
  const transformedPost = {
    ...data,
    translation: Array.isArray(data.translation)
      ? data.translation[0]
      : data.translation,
    categories: (data.categories || []).map((cat: any) => ({
      ...cat,
      category: {
        ...cat.category,
        translation: Array.isArray(cat.category.translations)
          ? cat.category.translations.find((t: any) => t.locale === locale) ||
          cat.category.translations[0]
          : cat.category.translations,
      },
    })),
    tags: (data.tags || []).map((tag: any) => ({
      ...tag,
      tag: {
        ...tag.tag,
        translation: Array.isArray(tag.tag.translations)
          ? tag.tag.translations.find((t: any) => t.locale === locale) ||
          tag.tag.translations[0]
          : tag.tag.translations,
      },
    })),
  };

  return transformedPost as unknown as BlogPostWithRelations;
}

/**
 * Get blog post by ID
 */
export async function getBlogPostById(
  id: string,
  locale: Locale = "en",
): Promise<BlogPostWithRelations | null> {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select(
      `
      *,
      translation:blog_post_translations!inner(
        id,
        title,
        excerpt,
        content,
        meta_description,
        locale
      ),
      categories:blog_post_categories(
        category:blog_categories(
          id,
          slug,
          icon,
          color,
          translations:blog_category_translations(name, description, locale)
        )
      ),
      tags:blog_post_tags(
        tag:blog_tags(
          id,
          slug,
          translations:blog_tag_translations(name, locale)
        )
      )
    `,
    )
    .eq("id", id)
    .eq("translation.locale", locale)
    .single();

  if (error) {
    console.error("Error fetching blog post by ID:", error);
    return null;
  }

  // Transform array translations to objects
  const transformedPost = {
    ...data,
    translation: Array.isArray(data.translation)
      ? data.translation[0]
      : data.translation,
    categories: (data.categories || []).map((cat: any) => ({
      ...cat,
      category: {
        ...cat.category,
        translation: Array.isArray(cat.category.translations)
          ? cat.category.translations.find((t: any) => t.locale === locale) ||
          cat.category.translations[0]
          : cat.category.translations,
      },
    })),
    tags: (data.tags || []).map((tag: any) => ({
      ...tag,
      tag: {
        ...tag.tag,
        translation: Array.isArray(tag.tag.translations)
          ? tag.tag.translations.find((t: any) => t.locale === locale) ||
          tag.tag.translations[0]
          : tag.tag.translations,
      },
    })),
  };

  return transformedPost as unknown as BlogPostWithRelations;
}

/**
 * Get blog post by ID with ALL translations (for editing)
 */
export async function getBlogPostByIdWithAllTranslations(
  id: string,
): Promise<BlogPostWithAllTranslations | null> {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select(
      `
      *,
      translations:blog_post_translations(
        id,
        post_id,
        locale,
        title,
        excerpt,
        content,
        meta_description,
        created_at,
        updated_at
      ),
      categories:blog_post_categories(
        category:blog_categories(
          id,
          slug,
          icon,
          color,
          translation:blog_category_translations!inner(name, description, locale)
        )
      ),
      tags:blog_post_tags(
        tag:blog_tags(
          id,
          slug,
          translation:blog_tag_translations!inner(name, locale)
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching blog post with all translations:", error);
    return null;
  }

  // Transform translations array to locale-keyed object
  const translationsArray = data.translations || [];
  const translationsObj = {
    en: translationsArray.find((t: any) => t.locale === "en") || null,
    ar: translationsArray.find((t: any) => t.locale === "ar") || null,
    ru: translationsArray.find((t: any) => t.locale === "ru") || null,
    es: translationsArray.find((t: any) => t.locale === "es") || null,
    zh: translationsArray.find((t: any) => t.locale === "zh") || null,
    fr: translationsArray.find((t: any) => t.locale === "fr") || null,
    de: translationsArray.find((t: any) => t.locale === "de") || null,
    ro: translationsArray.find((t: any) => t.locale === "ro") || null,
  };

  // Transform categories and tags
  const transformedCategories = (data.categories || []).map((cat: any) => ({
    category: {
      ...cat.category,
      translation: Array.isArray(cat.category.translation)
        ? cat.category.translation[0]
        : cat.category.translation,
    },
  }));

  const transformedTags = (data.tags || []).map((tag: any) => ({
    tag: {
      ...tag.tag,
      translation: Array.isArray(tag.tag.translation)
        ? tag.tag.translation[0]
        : tag.tag.translation,
    },
  }));

  const transformedPost = {
    ...data,
    translations: translationsObj,
    categories: transformedCategories,
    tags: transformedTags,
  };

  return transformedPost as unknown as BlogPostWithAllTranslations;
}

/**
 * Create blog post
 */
export async function createBlogPost(formData: any): Promise<BlogPost | null> {
  const {
    slug,
    status,
    featured_image,
    published_at,
    meta_keywords,
    is_featured,
    translations,
    category_ids,
    tag_ids,
  } = formData;

  // Calculate reading time from English content
  const readingTime = calculateReadingTime(translations.en.content);

  // Insert blog post
  const { data: post, error: postError } = await supabaseAdmin
    .from("blog_posts")
    .insert({
      slug,
      status,
      featured_image,
      published_at:
        published_at ||
        (status === "published" ? new Date().toISOString() : null),
      meta_keywords,
      is_featured,
      reading_time_minutes: readingTime.minutes,
    })
    .select()
    .single();

  if (postError) {
    console.error("Error creating blog post:", postError);
    throw new Error("Failed to create blog post");
  }

  // Insert translations
  const translationInserts = Object.entries(translations).map(
    ([locale, translation]: [string, any]) => ({
      post_id: post.id,
      locale,
      title: translation.title,
      excerpt: translation.excerpt || "",
      content: translation.content,
      meta_description: translation.meta_description || "",
    }),
  );

  const { error: translationsError } = await supabaseAdmin
    .from("blog_post_translations")
    .insert(translationInserts);

  if (translationsError) {
    console.error("Error creating translations:", translationsError);
    // Rollback post creation
    await supabaseAdmin.from("blog_posts").delete().eq("id", post.id);
    throw new Error("Failed to create translations");
  }

  // Insert category relations
  if (category_ids && category_ids.length > 0) {
    const categoryInserts = category_ids.map((category_id: string) => ({
      post_id: post.id,
      category_id,
    }));

    const { error: categoriesError } = await supabaseAdmin
      .from("blog_post_categories")
      .insert(categoryInserts);

    if (categoriesError) {
      console.error("Error creating category relations:", categoriesError);
    }
  }

  // Insert tag relations
  if (tag_ids && tag_ids.length > 0) {
    const tagInserts = tag_ids.map((tag_id: string) => ({
      post_id: post.id,
      tag_id,
    }));

    const { error: tagsError } = await supabaseAdmin
      .from("blog_post_tags")
      .insert(tagInserts);

    if (tagsError) {
      console.error("Error creating tag relations:", tagsError);
    }
  }

  return post;
}

/**
 * Update blog post
 */
export async function updateBlogPost(
  id: string,
  formData: any,
): Promise<BlogPost | null> {
  const {
    slug,
    status,
    featured_image,
    published_at,
    meta_keywords,
    is_featured,
    translations,
    category_ids,
    tag_ids,
  } = formData;

  // Calculate reading time from English content
  const readingTime = translations?.en?.content
    ? calculateReadingTime(translations.en.content)
    : null;

  // Update blog post
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (slug !== undefined) updateData.slug = slug;
  if (status !== undefined) updateData.status = status;
  if (featured_image !== undefined) updateData.featured_image = featured_image;
  if (published_at !== undefined) updateData.published_at = published_at;
  if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords;
  if (is_featured !== undefined) updateData.is_featured = is_featured;
  if (readingTime) updateData.reading_time_minutes = readingTime.minutes;

  const { data: post, error: postError } = await supabaseAdmin
    .from("blog_posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (postError) {
    console.error("Error updating blog post:", postError);
    throw new Error("Failed to update blog post");
  }

  // Update translations if provided
  if (translations) {
    for (const [locale, translation] of Object.entries(translations)) {
      const translationData = translation as any;

      const { error: translationError } = await supabaseAdmin
        .from("blog_post_translations")
        .upsert({
          post_id: id,
          locale,
          title: translationData.title,
          excerpt: translationData.excerpt || "",
          content: translationData.content,
          meta_description: translationData.meta_description || "",
          updated_at: new Date().toISOString(),
        });

      if (translationError) {
        console.error(
          `Error updating translation for ${locale}:`,
          translationError,
        );
      }
    }
  }

  // Update category relations if provided
  if (category_ids) {
    // Delete existing relations
    await supabaseAdmin.from("blog_post_categories").delete().eq("post_id", id);

    // Insert new relations
    if (category_ids.length > 0) {
      const categoryInserts = category_ids.map((category_id: string) => ({
        post_id: id,
        category_id,
      }));

      await supabaseAdmin.from("blog_post_categories").insert(categoryInserts);
    }
  }

  // Update tag relations if provided
  if (tag_ids) {
    // Delete existing relations
    await supabaseAdmin.from("blog_post_tags").delete().eq("post_id", id);

    // Insert new relations
    if (tag_ids.length > 0) {
      const tagInserts = tag_ids.map((tag_id: string) => ({
        post_id: id,
        tag_id,
      }));

      await supabaseAdmin.from("blog_post_tags").insert(tagInserts);
    }
  }

  return post;
}

/**
 * Delete blog post
 */
export async function deleteBlogPost(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting blog post:", error);
    return false;
  }

  return true;
}

/**
 * Increment view count
 */
export async function incrementViewCount(postId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("increment_blog_views", {
    post_id: postId,
  });

  if (error) {
    // If RPC doesn't exist, fallback to manual increment
    const { data: post } = await supabaseAdmin
      .from("blog_posts")
      .select("views_count")
      .eq("id", postId)
      .single();

    if (post) {
      await supabaseAdmin
        .from("blog_posts")
        .update({ views_count: (post.views_count || 0) + 1 })
        .eq("id", postId);
    }
  }
}

// =============================================
// CATEGORIES
// =============================================

/**
 * Get all categories
 */
export async function getBlogCategories(
  locale: Locale = "en",
): Promise<BlogCategoryListResponse> {
  const { data, error } = await supabaseAdmin
    .from("blog_categories")
    .select(
      `
      *,
      translation:blog_category_translations!inner(name, description, locale)
    `,
    )
    .eq("translation.locale", locale)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }

  // Transform array response to object
  const categories = (data || []).map((item: any) => ({
    ...item,
    translation: Array.isArray(item.translation)
      ? item.translation[0]
      : item.translation,
  }));

  return {
    categories: categories as BlogCategoryWithTranslation[],
  };
}

/**
 * Create category
 */
export async function createBlogCategory(
  formData: CategoryFormData,
): Promise<any> {
  const { slug, icon, color, sort_order, translations } = formData;

  // Insert category
  const { data: category, error: categoryError } = await supabaseAdmin
    .from("blog_categories")
    .insert({ slug, icon, color, sort_order })
    .select()
    .single();

  if (categoryError) {
    console.error("Error creating category:", categoryError);
    throw new Error("Failed to create category");
  }

  // Insert translations
  const translationInserts = Object.entries(translations).map(
    ([locale, translation]: [string, any]) => ({
      category_id: category.id,
      locale,
      name: translation.name,
      description: translation.description || "",
    }),
  );

  const { error: translationsError } = await supabaseAdmin
    .from("blog_category_translations")
    .insert(translationInserts);

  if (translationsError) {
    console.error("Error creating category translations:", translationsError);
    await supabaseAdmin.from("blog_categories").delete().eq("id", category.id);
    throw new Error("Failed to create category translations");
  }

  return category;
}

/**
 * Get category by ID
 */
export async function getBlogCategoryById(
  id: string,
  locale: Locale = "en",
): Promise<BlogCategoryWithTranslation | null> {
  const { data, error } = await supabaseAdmin
    .from("blog_categories")
    .select(
      `
      *,
      translation:blog_category_translations!inner(name, description, locale)
    `,
    )
    .eq("id", id)
    .eq("translation.locale", locale)
    .single();

  if (error) {
    console.error("Error fetching category:", error);
    return null;
  }

  return data as unknown as BlogCategoryWithTranslation;
}

/**
 * Get category by ID with ALL translations (for editing)
 */
export async function getCategoryByIdWithAllTranslations(
  id: string,
): Promise<any> {
  const { data, error } = await supabaseAdmin
    .from("blog_categories")
    .select(
      `
      *,
      translations:blog_category_translations(
        id,
        category_id,
        locale,
        name,
        description,
        created_at,
        updated_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching category with all translations:", error);
    return null;
  }

  // Transform translations array to locale-keyed object
  const translationsArray = data.translations || [];
  const translationsObj = {
    en: translationsArray.find((t: any) => t.locale === "en") || null,
    ar: translationsArray.find((t: any) => t.locale === "ar") || null,
    ru: translationsArray.find((t: any) => t.locale === "ru") || null,
    es: translationsArray.find((t: any) => t.locale === "es") || null,
    zh: translationsArray.find((t: any) => t.locale === "zh") || null,
    fr: translationsArray.find((t: any) => t.locale === "fr") || null,
    de: translationsArray.find((t: any) => t.locale === "de") || null,
    ro: translationsArray.find((t: any) => t.locale === "ro") || null,
  };

  return {
    ...data,
    translations: translationsObj,
  };
}

/**
 * Update category
 */
export async function updateBlogCategory(
  id: string,
  formData: Partial<CategoryFormData>,
): Promise<any> {
  const { slug, icon, color, sort_order, translations } = formData;

  // Update category base data
  const updateData: any = {};
  if (slug !== undefined) updateData.slug = slug;
  if (icon !== undefined) updateData.icon = icon;
  if (color !== undefined) updateData.color = color;
  if (sort_order !== undefined) updateData.sort_order = sort_order;

  if (Object.keys(updateData).length > 0) {
    const { error: categoryError } = await supabaseAdmin
      .from("blog_categories")
      .update(updateData)
      .eq("id", id);

    if (categoryError) {
      console.error("Error updating category:", categoryError);
      throw new Error("Failed to update category");
    }
  }

  // Update translations if provided
  if (translations) {
    for (const [locale, translation] of Object.entries(translations)) {
      const { error: translationError } = await supabaseAdmin
        .from("blog_category_translations")
        .upsert(
          {
            category_id: id,
            locale,
            name: translation.name,
            description: translation.description || "",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "category_id,locale",
          },
        );

      if (translationError) {
        console.error("Error updating category translation:", translationError);
        throw new Error(`Failed to update translation for locale: ${locale}`);
      }
    }
  }

  return await getBlogCategoryById(id);
}

/**
 * Delete category
 */
export async function deleteBlogCategory(id: string): Promise<void> {
  // First delete translations (foreign key constraint)
  const { error: translationsError } = await supabaseAdmin
    .from("blog_category_translations")
    .delete()
    .eq("category_id", id);

  if (translationsError) {
    console.error("Error deleting category translations:", translationsError);
    throw new Error("Failed to delete category translations");
  }

  // Then delete category
  const { error: categoryError } = await supabaseAdmin
    .from("blog_categories")
    .delete()
    .eq("id", id);

  if (categoryError) {
    console.error("Error deleting category:", categoryError);
    throw new Error("Failed to delete category");
  }
}

// =============================================
// TAGS
// =============================================

/**
 * Get all tags
 */
export async function getBlogTags(
  locale: Locale = "en",
): Promise<BlogTagListResponse> {
  const { data, error } = await supabaseAdmin
    .from("blog_tags")
    .select(
      `
      *,
      translation:blog_tag_translations!inner(name, locale)
    `,
    )
    .eq("translation.locale", locale)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tags:", error);
    throw new Error("Failed to fetch tags");
  }

  // Transform array response to object
  const tags = (data || []).map((item: any) => ({
    ...item,
    translation: Array.isArray(item.translation)
      ? item.translation[0]
      : item.translation,
  }));

  return {
    tags: tags as BlogTagWithTranslation[],
  };
}

/**
 * Create tag
 */
export async function createBlogTag(formData: TagFormData): Promise<any> {
  const { slug, translations } = formData;

  // Insert tag
  const { data: tag, error: tagError } = await supabaseAdmin
    .from("blog_tags")
    .insert({ slug })
    .select()
    .single();

  if (tagError) {
    console.error("Error creating tag:", tagError);
    throw new Error("Failed to create tag");
  }

  // Insert translations
  const translationInserts = Object.entries(translations).map(
    ([locale, translation]: [string, any]) => ({
      tag_id: tag.id,
      locale,
      name: translation.name,
    }),
  );

  const { error: translationsError } = await supabaseAdmin
    .from("blog_tag_translations")
    .insert(translationInserts);

  if (translationsError) {
    console.error("Error creating tag translations:", translationsError);
    await supabaseAdmin.from("blog_tags").delete().eq("id", tag.id);
    throw new Error("Failed to create tag translations");
  }

  return tag;
}

/**
 * Get tag by ID
 */
export async function getBlogTagById(
  id: string,
  locale: Locale = "en",
): Promise<BlogTagWithTranslation | null> {
  const { data, error } = await supabaseAdmin
    .from("blog_tags")
    .select(
      `
      *,
      translation:blog_tag_translations!inner(name, locale)
    `,
    )
    .eq("id", id)
    .eq("translation.locale", locale)
    .single();

  if (error) {
    console.error("Error fetching tag:", error);
    return null;
  }

  // Transform array to object
  const tag = {
    ...data,
    translation: Array.isArray(data.translation)
      ? data.translation[0]
      : data.translation,
  };

  return tag as BlogTagWithTranslation;
}

/**
 * Get tag by ID with ALL translations (for editing)
 */
export async function getTagByIdWithAllTranslations(id: string): Promise<any> {
  const { data, error } = await supabaseAdmin
    .from("blog_tags")
    .select(
      `
      *,
      translations:blog_tag_translations(
        id,
        tag_id,
        locale,
        name,
        created_at,
        updated_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching tag with all translations:", error);
    return null;
  }

  // Transform translations array to locale-keyed object
  const translationsArray = data.translations || [];
  const translationsObj = {
    en: translationsArray.find((t: any) => t.locale === "en") || null,
    ar: translationsArray.find((t: any) => t.locale === "ar") || null,
    ru: translationsArray.find((t: any) => t.locale === "ru") || null,
    es: translationsArray.find((t: any) => t.locale === "es") || null,
    zh: translationsArray.find((t: any) => t.locale === "zh") || null,
    fr: translationsArray.find((t: any) => t.locale === "fr") || null,
    de: translationsArray.find((t: any) => t.locale === "de") || null,
    ro: translationsArray.find((t: any) => t.locale === "ro") || null,
  };

  return {
    ...data,
    translations: translationsObj,
  };
}

/**
 * Update tag
 */
export async function updateBlogTag(
  id: string,
  formData: Partial<TagFormData>,
): Promise<any> {
  const { slug, translations } = formData;

  // Update tag base data
  if (slug !== undefined) {
    const { error: tagError } = await supabaseAdmin
      .from("blog_tags")
      .update({ slug })
      .eq("id", id);

    if (tagError) {
      console.error("Error updating tag:", tagError);
      throw new Error("Failed to update tag");
    }
  }

  // Update translations if provided
  if (translations) {
    for (const [locale, translation] of Object.entries(translations)) {
      const { error: translationError } = await supabaseAdmin
        .from("blog_tag_translations")
        .upsert(
          {
            tag_id: id,
            locale,
            name: translation.name,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "tag_id,locale",
          },
        );

      if (translationError) {
        console.error("Error updating tag translation:", translationError);
        throw new Error(`Failed to update translation for locale: ${locale}`);
      }
    }
  }

  return await getBlogTagById(id);
}

/**
 * Delete tag
 */
export async function deleteBlogTag(id: string): Promise<void> {
  // First delete translations (foreign key constraint)
  const { error: translationsError } = await supabaseAdmin
    .from("blog_tag_translations")
    .delete()
    .eq("tag_id", id);

  if (translationsError) {
    console.error("Error deleting tag translations:", translationsError);
    throw new Error("Failed to delete tag translations");
  }

  // Then delete tag
  const { error: tagError } = await supabaseAdmin
    .from("blog_tags")
    .delete()
    .eq("id", id);

  if (tagError) {
    console.error("Error deleting tag:", tagError);
    throw new Error("Failed to delete tag");
  }
}

// =============================================
// HELPERS
// =============================================

/**
 * Get all published post slugs (for generateStaticParams)
 */
export async function getAllPublishedSlugs(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("slug")
    .eq("status", "published")
    .not("published_at", "is", null);

  if (error) {
    console.error("Error fetching slugs:", error);
    return [];
  }

  return data.map((post) => post.slug);
}

/**
 * Blog post data for sitemap generation
 */
export interface BlogPostSitemapData {
  slug: string;
  published_at: string;
  updated_at: string;
}

/**
 * Get all published posts with dates for sitemap generation
 * Returns slug, published_at, and updated_at for proper lastmod
 */
export async function getAllPublishedSlugsWithDates(): Promise<BlogPostSitemapData[]> {
  const { data, error } = await supabaseAdmin
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Error fetching slugs with dates:", error);
    return [];
  }

  return data.map((post) => ({
    slug: post.slug,
    published_at: post.published_at!,
    updated_at: post.updated_at,
  }));
}

/**
 * Check if slug is unique
 */
export async function isSlugUnique(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabaseAdmin.from("blog_posts").select("id").eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking slug uniqueness:", error);
    return false;
  }

  return !data || data.length === 0;
}
