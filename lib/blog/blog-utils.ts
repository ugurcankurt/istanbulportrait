/**
 * Blog Utility Functions
 * Slug generation, reading time calculation, text processing
 */

import type {
  Locale,
  ReadingTimeResult,
  SlugGenerationOptions,
} from "@/types/blog";

// =============================================
// SLUG GENERATION
// =============================================

/**
 * Generate URL-friendly slug from text
 * Supports multiple locales with proper transliteration
 */
export function generateSlug(
  text: string,
  options: SlugGenerationOptions = {},
): string {
  const { maxLength = 200, locale = "en" } = options;

  let slug = text.toLowerCase().trim();

  // Transliteration maps for different locales
  const transliterationMaps: Record<string, Record<string, string>> = {
    // Turkish characters
    tr: {
      ç: "c",
      ğ: "g",
      ı: "i",
      İ: "i",
      ö: "o",
      ş: "s",
      ü: "u",
      Ç: "c",
      Ğ: "g",
      Ö: "o",
      Ş: "s",
      Ü: "u",
    },
    // Russian characters (Cyrillic to Latin)
    ru: {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "yo",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sch",
      ъ: "",
      ы: "y",
      ь: "",
      э: "e",
      ю: "yu",
      я: "ya",
    },
    // Arabic characters (simplified transliteration)
    ar: {
      ا: "a",
      ب: "b",
      ت: "t",
      ث: "th",
      ج: "j",
      ح: "h",
      خ: "kh",
      د: "d",
      ذ: "dh",
      ر: "r",
      ز: "z",
      س: "s",
      ش: "sh",
      ص: "s",
      ض: "d",
      ط: "t",
      ظ: "z",
      ع: "a",
      غ: "gh",
      ف: "f",
      ق: "q",
      ك: "k",
      ل: "l",
      م: "m",
      ن: "n",
      ه: "h",
      و: "w",
      ي: "y",
      ة: "h",
      ى: "a",
      ء: "",
    },
  };

  // Apply transliteration based on locale
  const transliterationMap = transliterationMaps[locale];
  if (transliterationMap) {
    Object.entries(transliterationMap).forEach(([char, replacement]) => {
      slug = slug.replace(new RegExp(char, "g"), replacement);
    });
  }

  // Remove accents and diacritics
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Replace special characters with hyphens
  slug = slug
    .replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/-+/g, "-") // Replace multiple - with single -
    .replace(/^-+|-+$/g, ""); // Trim - from start and end

  // Limit length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
    // Remove trailing incomplete word
    const lastDash = slug.lastIndexOf("-");
    if (lastDash > 0) {
      slug = slug.substring(0, lastDash);
    }
  }

  return slug;
}

/**
 * Check if slug already exists (to be used with database)
 */
export async function isSlugUnique(
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  // This will be implemented in the blog service
  // For now, return true
  return true;
}

/**
 * Generate unique slug by appending number if needed
 */
export async function generateUniqueSlug(
  text: string,
  options: SlugGenerationOptions = {},
  excludeId?: string,
): Promise<string> {
  const baseSlug = generateSlug(text, options);
  let slug = baseSlug;
  let counter = 1;

  // Check uniqueness (will be implemented with database check)
  while (!(await isSlugUnique(slug, excludeId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// =============================================
// READING TIME CALCULATION
// =============================================

/**
 * Calculate reading time from content
 * Uses industry standard of 200-250 words per minute
 */
export function calculateReadingTime(
  content: string,
  wordsPerMinute: number = 225,
): ReadingTimeResult {
  // Remove markdown syntax
  const plainText = stripMarkdown(content);

  // Count words
  const words = plainText.trim().split(/\s+/).length;

  // Calculate minutes
  const minutes = Math.ceil(words / wordsPerMinute);

  return {
    minutes,
    words,
    text: `${minutes} min read`,
  };
}

/**
 * Strip markdown syntax from text
 */
export function stripMarkdown(markdown: string): string {
  return (
    markdown
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      // Remove headings
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Remove links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      // Remove blockquotes
      .replace(/^\s*>\s+/gm, "")
      // Remove lists
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Clean up extra whitespace
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}

// =============================================
// TEXT PROCESSING
// =============================================

/**
 * Generate excerpt from content
 * Intelligently finds first paragraph or truncates at sentence boundary
 */
export function generateExcerpt(
  content: string,
  maxLength: number = 200,
): string {
  const plainText = stripMarkdown(content);

  // Try to find first paragraph
  const paragraphs = plainText.split("\n\n");
  const firstParagraph = paragraphs[0]?.trim();

  if (firstParagraph && firstParagraph.length <= maxLength) {
    return firstParagraph;
  }

  // Truncate at sentence boundary
  if (plainText.length <= maxLength) {
    return plainText;
  }

  const truncated = plainText.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastExclamation = truncated.lastIndexOf("!");
  const lastQuestion = truncated.lastIndexOf("?");

  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

  if (lastSentenceEnd > maxLength * 0.7) {
    // If we found a sentence end in the last 30%
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // Otherwise, truncate at last space and add ellipsis
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
}

/**
 * Extract keywords from content
 * Simple keyword extraction (can be enhanced with NLP)
 */
export function extractKeywords(
  content: string,
  maxKeywords: number = 10,
): string[] {
  const plainText = stripMarkdown(content).toLowerCase();

  // Common stop words to exclude
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "is",
    "was",
    "are",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "may",
    "might",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
  ]);

  // Extract words (min 3 characters)
  const words = plainText.match(/\b[a-z]{3,}\b/g) || [];

  // Count word frequency
  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    if (!stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  });

  // Sort by frequency and return top keywords
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

// =============================================
// URL & PATH UTILITIES
// =============================================

/**
 * Build blog post URL
 */
export function buildBlogPostUrl(
  slug: string,
  locale: Locale,
  baseUrl: string = "",
): string {
  return `${baseUrl}/${locale}/blog/${slug}`;
}

/**
 * Build blog category URL
 */
export function buildBlogCategoryUrl(
  categorySlug: string,
  locale: Locale,
  baseUrl: string = "",
): string {
  return `${baseUrl}/${locale}/blog/category/${categorySlug}`;
}

/**
 * Build blog tag URL
 */
export function buildBlogTagUrl(
  tagSlug: string,
  locale: Locale,
  baseUrl: string = "",
): string {
  return `${baseUrl}/${locale}/blog/tag/${tagSlug}`;
}

// =============================================
// DATE FORMATTING
// =============================================

/**
 * Format blog post date
 */
export function formatBlogDate(
  date: string | Date,
  locale: Locale = "en",
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const localeMap: Record<Locale, string> = {
    en: "en-US",
    ar: "ar-EG",
    ru: "ru-RU",
    es: "es-ES",
    zh: "zh-CN",
    fr: "fr-FR",
    de: "de-DE",
    ro: "ro-RO",
  };

  return dateObj.toLocaleDateString(localeMap[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(
  date: string | Date,
  locale: Locale = "en",
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
        -interval,
        unit as Intl.RelativeTimeFormatUnit,
      );
    }
  }

  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    0,
    "second",
  );
}

// =============================================
// VALIDATION HELPERS
// =============================================

/**
 * Validate image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const ext = parsedUrl.pathname.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext || "");
  } catch {
    return false;
  }
}

/**
 * Validate YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  const youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
  return youtubeRegex.test(url);
}

/**
 * Extract YouTube video ID
 */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

// =============================================
// SANITIZATION
// =============================================

/**
 * Sanitize HTML content (basic XSS prevention)
 * Note: For production, use a proper sanitization library like DOMPurify
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  return sanitized;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + "..."
    : truncated + "...";
}

// =============================================
// MARKDOWN UTILITIES
// =============================================

/**
 * Get table of contents from markdown
 * Extracts headings for navigation
 */
export function getTableOfContents(markdown: string): Array<{
  level: number;
  text: string;
  id: string;
}> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];

  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = generateSlug(text);

    headings.push({ level, text, id });
  }

  return headings;
}

/**
 * Count images in markdown content
 */
export function countImagesInMarkdown(markdown: string): number {
  const imageRegex = /!\[([^\]]*)\]\([^)]+\)/g;
  const matches = markdown.match(imageRegex);
  return matches ? matches.length : 0;
}

/**
 * Count code blocks in markdown content
 */
export function countCodeBlocks(markdown: string): number {
  const codeBlockRegex = /```[\s\S]*?```/g;
  const matches = markdown.match(codeBlockRegex);
  return matches ? matches.length : 0;
}
