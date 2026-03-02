/**
 * Blog System TypeScript Types
 * Istanbul Portrait - SEO-friendly multilingual blog
 */

// Supported locales
export type Locale = "en" | "ar" | "ru" | "es" | "zh" | "fr" | "de" | "ro";

// Blog post status
export type BlogStatus = "draft" | "published" | "archived";

// =============================================
// DATABASE TYPES (matching Supabase schema)
// =============================================

export interface BlogPost {
  id: string;
  slug: string;
  status: BlogStatus;
  featured_image: string | null;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  reading_time_minutes: number;
  meta_keywords: string[];
  is_featured: boolean;
}

export interface BlogPostTranslation {
  id: string;
  post_id: string;
  locale: Locale;
  title: string;
  excerpt: string | null;
  content: string;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  slug: string;
  icon: string | null;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogCategoryTranslation {
  id: string;
  category_id: string;
  locale: Locale;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface BlogTagTranslation {
  id: string;
  tag_id: string;
  locale: Locale;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPostCategory {
  post_id: string;
  category_id: string;
  created_at: string;
}

export interface BlogPostTag {
  post_id: string;
  tag_id: string;
  created_at: string;
}

// =============================================
// COMPOSITE TYPES (with relations)
// =============================================

export interface BlogPostWithTranslations extends BlogPost {
  translations: Record<Locale, BlogPostTranslation>;
}

export interface BlogPostWithRelations extends BlogPost {
  translation: BlogPostTranslation; // Single locale translation
  categories: Array<{
    category: BlogCategory & { translation: BlogCategoryTranslation };
  }>;
  tags: Array<{ tag: BlogTag & { translation: BlogTagTranslation } }>;
  author?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface BlogPostWithAllTranslations extends BlogPost {
  translations: {
    en: BlogPostTranslation | null;
    ar: BlogPostTranslation | null;
    ru: BlogPostTranslation | null;
    es: BlogPostTranslation | null;
    zh: BlogPostTranslation | null;
    fr: BlogPostTranslation | null;
    de: BlogPostTranslation | null;
    ro: BlogPostTranslation | null;
  };
  categories?: Array<{
    category: BlogCategory & { translation: BlogCategoryTranslation };
  }>;
  tags?: Array<{
    tag: BlogTag & { translation: BlogTagTranslation };
  }>;
}

export interface BlogCategoryWithTranslation extends BlogCategory {
  translation: BlogCategoryTranslation;
  post_count?: number;
}

export interface BlogTagWithTranslation extends BlogTag {
  translation: BlogTagTranslation;
  post_count?: number;
}

// =============================================
// FORM DATA TYPES (for admin)
// =============================================

export interface BlogTranslationInput {
  title?: string;
  excerpt?: string;
  content?: string;
  meta_description?: string;
}

export interface BlogFormData {
  slug: string;
  status: BlogStatus;
  featured_image: string | null;
  published_at: string | null;
  meta_keywords: string[];
  is_featured: boolean;
  translations: Record<Locale, BlogTranslationInput>;
  category_ids: string[];
  tag_ids: string[];
}

export interface CategoryFormData {
  slug: string;
  icon?: string | null;
  color: string;
  sort_order: number;
  translations: Record<Locale, { name?: string; description?: string }>;
}

export interface TagFormData {
  slug: string;
  translations: Record<Locale, { name?: string }>;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface BlogPostListResponse {
  posts: BlogPostWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlogCategoryListResponse {
  categories: BlogCategoryWithTranslation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlogTagListResponse {
  tags: BlogTagWithTranslation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BlogPostResponse {
  success: boolean;
  post?: BlogPostWithRelations;
  error?: string;
}

export interface BlogCategoryResponse {
  success: boolean;
  category?: BlogCategoryWithTranslation;
  error?: string;
}

export interface BlogTagResponse {
  success: boolean;
  tag?: BlogTagWithTranslation;
  error?: string;
}

// =============================================
// FILTER & QUERY TYPES
// =============================================

export interface BlogFilters {
  search: string;
  status: BlogStatus | "all";
  category_id: string | "all";
  tag_id: string | "all";
  locale: Locale;
  is_featured: boolean | "all";
  sort_by: "created_at" | "published_at" | "views_count" | "title";
  sort_order: "asc" | "desc";
}

export interface BlogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlogStatus | "all";
  category_id?: string;
  tag_id?: string;
  locale?: Locale;
  is_featured?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// =============================================
// SEO & METADATA TYPES
// =============================================

export interface BlogSEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical_url: string;
  og_image: string | null;
  og_type: "article";
  article_published_time: string | null;
  article_modified_time: string;
  article_author: string;
  article_section: string; // Category name
  article_tags: string[];
}

export interface BlogStructuredData {
  "@context": "https://schema.org";
  "@type": "BlogPosting" | "Article";
  headline: string;
  description: string;
  image: string | string[];
  author: {
    "@type": "Person";
    name: string;
    url?: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  keywords?: string;
  articleBody?: string;
  wordCount?: number;
  timeRequired?: string; // ISO 8601 duration format (e.g., "PT5M")
}

// =============================================
// UTILITY TYPES
// =============================================

export interface ReadingTimeResult {
  minutes: number;
  words: number;
  text: string; // e.g., "5 min read"
}

export interface SlugGenerationOptions {
  allowDuplicates?: boolean;
  maxLength?: number;
  locale?: Locale;
}

export interface BlogImageUploadResult {
  url: string;
  path: string;
  size: number;
  width?: number;
  height?: number;
}

// =============================================
// ADMIN DASHBOARD TYPES
// =============================================

export interface BlogDashboardStats {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_categories: number;
  total_tags: number;
  recent_posts: BlogPostWithRelations[];
  popular_posts: BlogPostWithRelations[];
}

export interface BlogSearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  categories: string[];
  tags: string[];
  relevance_score: number;
}

// =============================================
// PAGINATION HELPER TYPE
// =============================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// =============================================
// ERROR TYPES
// =============================================

export interface BlogError {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface BlogValidationError extends BlogError {
  code: "VALIDATION_ERROR";
  field: string;
}

export interface BlogNotFoundError extends BlogError {
  code: "NOT_FOUND";
  resource: "post" | "category" | "tag";
  identifier: string;
}

export interface BlogPermissionError extends BlogError {
  code: "PERMISSION_DENIED";
  action: "create" | "read" | "update" | "delete";
  resource: string;
}
