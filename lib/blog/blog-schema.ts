/**
 * Blog Structured Data (JSON-LD)
 * SEO optimization for blog posts
 */

import { SEO_CONFIG } from "@/lib/seo-config";
import type { BlogPostWithRelations, Locale } from "@/types/blog";
import { stripMarkdown } from "./blog-utils";

export function generateBlogPostingSchema(
  post: BlogPostWithRelations,
  locale: Locale,
  baseUrl: string = SEO_CONFIG.site.url,
) {
  const articleUrl = `${baseUrl}/${locale}/blog/${post.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.translation.title,
    description: post.translation.meta_description || post.translation.excerpt,
    image: post.featured_image || SEO_CONFIG.organization.logo,
    author: {
      "@type": "Person",
      name: "Istanbul Portrait",
      url: `${baseUrl}/${locale}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      logo: {
        "@type": "ImageObject",
        url: SEO_CONFIG.organization.logo,
      },
    },
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    keywords: post.meta_keywords.join(", "),
    articleBody: stripMarkdown(post.translation.content).substring(0, 500),
    wordCount: stripMarkdown(post.translation.content).split(" ").length,
    timeRequired: `PT${post.reading_time_minutes}M`,
    inLanguage: locale,
  };
}

export function generateBlogBreadcrumbSchema(
  post: BlogPostWithRelations,
  locale: Locale,
  baseUrl: string = SEO_CONFIG.site.url,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/${locale}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.translation.title,
        item: `${baseUrl}/${locale}/blog/${post.slug}`,
      },
    ],
  };
}
