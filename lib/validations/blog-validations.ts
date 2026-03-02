/**
 * Blog System Validation Schemas
 * Using Zod for type-safe validation with i18n support
 */

import { z } from "zod";

// =============================================
// LOCALE & STATUS ENUMS
// =============================================

export const localeSchema = z.enum(["en", "ar", "ru", "es", "zh", "fr", "de", "ro"]);
export const blogStatusSchema = z.enum(["draft", "published", "archived"]);

// =============================================
// BLOG POST TRANSLATION SCHEMA
// =============================================

export const blogTranslationInputSchema = z.object({
  title: z
    .string()
    .max(200, "validation.blog.title_max")
    .optional()
    .or(z.literal("")),
  excerpt: z
    .string()
    .max(500, "validation.blog.excerpt_max")
    .optional()
    .or(z.literal("")),
  content: z.string().optional().or(z.literal("")),
  meta_description: z
    .string()
    .max(160, "validation.blog.meta_description_max")
    .optional()
    .or(z.literal("")),
});

// =============================================
// BLOG POST SCHEMA (Create/Update)
// =============================================

export const blogFormSchema = z.object({
  slug: z
    .string()
    .min(1, "validation.blog.slug_required")
    .max(200, "validation.blog.slug_max")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "validation.blog.slug_invalid"),
  status: blogStatusSchema,
  featured_image: z
    .string()
    .url("validation.blog.image_url_invalid")
    .nullable(),
  published_at: z.string().datetime().nullable(),
  meta_keywords: z.array(z.string()).default([]),
  is_featured: z.boolean().default(false),
  translations: z.object({
    en: blogTranslationInputSchema,
    ar: blogTranslationInputSchema,
    ru: blogTranslationInputSchema,
    es: blogTranslationInputSchema,
    zh: blogTranslationInputSchema,
    fr: blogTranslationInputSchema,
    de: blogTranslationInputSchema,
    ro: blogTranslationInputSchema,
  }),
  category_ids: z.array(z.string().uuid()).default([]),
  tag_ids: z.array(z.string().uuid()).default([]),
});

// Partial schema for updates (all fields optional)
export const blogUpdateSchema = blogFormSchema.partial();

// =============================================
// DYNAMIC SCHEMA WITH TRANSLATIONS
// =============================================

export const createBlogFormSchema = (t: any) =>
  z.object({
    slug: z
      .string()
      .min(1, t("slug_required"))
      .max(200, t("slug_max"))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("slug_invalid")),
    status: blogStatusSchema,
    featured_image: z.string().url(t("image_url_invalid")).nullable(),
    published_at: z.string().datetime().nullable(),
    meta_keywords: z.array(z.string()).default([]),
    is_featured: z.boolean().default(false),
    translations: z.object({
      en: z.object({
        title: z.string().min(1, t("title_required")).max(200, t("title_max")),
        excerpt: z
          .string()
          .max(500, t("excerpt_max"))
          .optional()
          .or(z.literal("")),
        content: z.string().min(1, t("content_required")),
        meta_description: z
          .string()
          .max(160, t("meta_description_max"))
          .optional()
          .or(z.literal("")),
      }),
      ar: z.object({
        title: z.string().min(1, t("title_required")).max(200, t("title_max")),
        excerpt: z
          .string()
          .max(500, t("excerpt_max"))
          .optional()
          .or(z.literal("")),
        content: z.string().min(1, t("content_required")),
        meta_description: z
          .string()
          .max(160, t("meta_description_max"))
          .optional()
          .or(z.literal("")),
      }),
      ru: z.object({
        title: z.string().min(1, t("title_required")).max(200, t("title_max")),
        excerpt: z
          .string()
          .max(500, t("excerpt_max"))
          .optional()
          .or(z.literal("")),
        content: z.string().min(1, t("content_required")),
        meta_description: z
          .string()
          .max(160, t("meta_description_max"))
          .optional()
          .or(z.literal("")),
      }),
      es: z.object({
        title: z.string().min(1, t("title_required")).max(200, t("title_max")),
        excerpt: z
          .string()
          .max(500, t("excerpt_max"))
          .optional()
          .or(z.literal("")),
        content: z.string().min(1, t("content_required")),
        meta_description: z
          .string()
          .max(160, t("meta_description_max"))
          .optional()
          .or(z.literal("")),
      }),
      fr: z.object({
        title: z.string().min(1, t("title_required")).max(200, t("title_max")),
        excerpt: z
          .string()
          .max(500, t("excerpt_max"))
          .optional()
          .or(z.literal("")),
        content: z.string().min(1, t("content_required")),
        meta_description: z
          .string()
          .max(160, t("meta_description_max"))
          .optional()
          .or(z.literal("")),
      }),
      de: z.object({
        title: z.string().min(1, t("title_required")).max(200, t("title_max")),
        excerpt: z
          .string()
          .max(500, t("excerpt_max"))
          .optional()
          .or(z.literal("")),
        content: z.string().min(1, t("content_required")),
        meta_description: z
          .string()
          .max(160, t("meta_description_max"))
          .optional()
          .or(z.literal("")),
      }),
      ro: z.object({
        title: z.string().min(1, t("title_required")).max(200, t("title_max")),
        excerpt: z
          .string()
          .max(500, t("excerpt_max"))
          .optional()
          .or(z.literal("")),
        content: z.string().min(1, t("content_required")),
        meta_description: z
          .string()
          .max(160, t("meta_description_max"))
          .optional()
          .or(z.literal("")),
      }),
    }),
    category_ids: z.array(z.string().uuid()).default([]),
    tag_ids: z.array(z.string().uuid()).default([]),
  });

// =============================================
// CATEGORY SCHEMA
// =============================================

export const categoryTranslationInputSchema = z.object({
  name: z
    .string()
    .max(100, "validation.blog.category_name_max")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(500, "validation.blog.category_description_max")
    .optional()
    .or(z.literal("")),
});

export const categoryFormSchema = z.object({
  slug: z
    .string()
    .min(1, "validation.blog.slug_required")
    .max(100, "validation.blog.slug_max")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "validation.blog.slug_invalid"),
  icon: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "validation.blog.color_invalid")
    .default("#6366f1"),
  sort_order: z.number().int().min(0).default(0),
  translations: z.object({
    en: categoryTranslationInputSchema,
    ar: categoryTranslationInputSchema,
    ru: categoryTranslationInputSchema,
    es: categoryTranslationInputSchema,
    zh: categoryTranslationInputSchema,
    fr: categoryTranslationInputSchema,
    de: categoryTranslationInputSchema,
    ro: categoryTranslationInputSchema,
  }),
});

export const categoryUpdateSchema = categoryFormSchema.partial();

export const createCategoryFormSchema = (t: any) =>
  z.object({
    slug: z
      .string()
      .min(1, t("slug_required"))
      .max(100, t("slug_max"))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("slug_invalid")),
    icon: z.string().optional().nullable(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, t("color_invalid"))
      .default("#6366f1"),
    sort_order: z.number().int().min(0).default(0),
    translations: z.object({
      en: z.object({
        name: z.string().min(1, t("name_required")).max(100, t("name_max")),
        description: z
          .string()
          .max(500, t("description_max"))
          .optional()
          .or(z.literal("")),
      }),
      ar: z.object({
        name: z.string().min(1, t("name_required")).max(100, t("name_max")),
        description: z
          .string()
          .max(500, t("description_max"))
          .optional()
          .or(z.literal("")),
      }),
      ru: z.object({
        name: z.string().min(1, t("name_required")).max(100, t("name_max")),
        description: z
          .string()
          .max(500, t("description_max"))
          .optional()
          .or(z.literal("")),
      }),
      es: z.object({
        name: z.string().min(1, t("name_required")).max(100, t("name_max")),
        description: z
          .string()
          .max(500, t("description_max"))
          .optional()
          .or(z.literal("")),
      }),
      fr: z.object({
        name: z.string().min(1, t("name_required")).max(100, t("name_max")),
        description: z
          .string()
          .max(500, t("description_max"))
          .optional()
          .or(z.literal("")),
      }),
      de: z.object({
        name: z.string().min(1, t("name_required")).max(100, t("name_max")),
        description: z
          .string()
          .max(500, t("description_max"))
          .optional()
          .or(z.literal("")),
      }),
      ro: z.object({
        name: z.string().min(1, t("name_required")).max(100, t("name_max")),
        description: z
          .string()
          .max(500, t("description_max"))
          .optional()
          .or(z.literal("")),
      }),
    }),
  });

// =============================================
// TAG SCHEMA
// =============================================

export const tagTranslationInputSchema = z.object({
  name: z
    .string()
    .max(50, "validation.blog.tag_name_max")
    .optional()
    .or(z.literal("")),
});

export const tagFormSchema = z.object({
  slug: z
    .string()
    .min(1, "validation.blog.slug_required")
    .max(50, "validation.blog.slug_max")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "validation.blog.slug_invalid"),
  translations: z.object({
    en: tagTranslationInputSchema,
    ar: tagTranslationInputSchema,
    ru: tagTranslationInputSchema,
    es: tagTranslationInputSchema,
    zh: tagTranslationInputSchema,
    fr: tagTranslationInputSchema,
    de: tagTranslationInputSchema,
    ro: tagTranslationInputSchema,
  }),
});

export const tagUpdateSchema = tagFormSchema.partial();

export const createTagFormSchema = (t: any) =>
  z.object({
    slug: z
      .string()
      .min(1, t("slug_required"))
      .max(50, t("slug_max"))
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t("slug_invalid")),
    translations: z.object({
      en: z.object({
        name: z.string().min(1, t("name_required")).max(50, t("name_max")),
      }),
      ar: z.object({
        name: z.string().min(1, t("name_required")).max(50, t("name_max")),
      }),
      ru: z.object({
        name: z.string().min(1, t("name_required")).max(50, t("name_max")),
      }),
      es: z.object({
        name: z.string().min(1, t("name_required")).max(50, t("name_max")),
      }),
      fr: z.object({
        name: z.string().min(1, t("name_required")).max(50, t("name_max")),
      }),
      de: z.object({
        name: z.string().min(1, t("name_required")).max(50, t("name_max")),
      }),
      ro: z.object({
        name: z.string().min(1, t("name_required")).max(50, t("name_max")),
      }),
    }),
  });

// =============================================
// QUERY PARAMS SCHEMAS
// =============================================

export const blogQueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(["draft", "published", "archived", "all"]).default("all"),
  category_id: z.string().uuid().optional(),
  tag_id: z.string().uuid().optional(),
  locale: localeSchema.default("en"),
  is_featured: z.coerce.boolean().optional(),
  sort_by: z
    .enum(["created_at", "published_at", "views_count", "title"])
    .default("published_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export const categoryQueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  locale: localeSchema.default("en"),
  sort_by: z.enum(["sort_order", "name", "created_at"]).default("sort_order"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export const tagQueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  locale: localeSchema.default("en"),
  sort_by: z.enum(["name", "created_at"]).default("name"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

// =============================================
// VIEW COUNTER SCHEMA
// =============================================

export const viewCounterSchema = z.object({
  post_id: z.string().uuid("validation.blog.invalid_post_id"),
});

// =============================================
// IMAGE UPLOAD SCHEMA
// =============================================

export const imageUploadSchema = z.object({
  file: z.instanceof(File, { message: "validation.blog.file_required" }),
  max_size: z.number().default(5 * 1024 * 1024), // 5MB
  allowed_types: z
    .array(z.string())
    .default(["image/jpeg", "image/png", "image/webp", "image/gif"]),
});

// =============================================
// SLUG GENERATION SCHEMA
// =============================================

export const slugGenerationSchema = z.object({
  text: z.string().min(1, "validation.blog.text_required"),
  locale: localeSchema.optional(),
  max_length: z.number().int().positive().default(200),
  allow_duplicates: z.boolean().default(false),
});

// =============================================
// TYPE EXPORTS
// =============================================

export type BlogFormData = z.infer<typeof blogFormSchema>;
export type BlogUpdateData = z.infer<typeof blogUpdateSchema>;
export type CategoryFormData = z.infer<typeof categoryFormSchema>;
export type CategoryUpdateData = z.infer<typeof categoryUpdateSchema>;
export type TagFormData = z.infer<typeof tagFormSchema>;
export type TagUpdateData = z.infer<typeof tagUpdateSchema>;
export type BlogQueryParams = z.infer<typeof blogQueryParamsSchema>;
export type CategoryQueryParams = z.infer<typeof categoryQueryParamsSchema>;
export type TagQueryParams = z.infer<typeof tagQueryParamsSchema>;
export type ViewCounterData = z.infer<typeof viewCounterSchema>;
export type ImageUploadData = z.infer<typeof imageUploadSchema>;
export type SlugGenerationData = z.infer<typeof slugGenerationSchema>;
