import { Metadata } from "next";
import { SiteSettings } from "./settings-service";

// ----------------------------------------------------
// CORE SEO HELPERS
// ----------------------------------------------------

/**
 * Strips HTML tags from rich text and truncates for SEO meta description.
 */
export function generateSeoDescription(
  content: string | null | undefined,
  maxLength = 160
): string {
  if (!content) return "";
  
  // 1. Remove HTML tags
  let cleanText = content.replace(/<[^>]*>?/gm, " ");
  // 2. Remove markdown/formatting chars if any
  cleanText = cleanText.replace(/[#*_~`>\[\]\(\)]/g, " ");
  // 3. Normalize whitespaces
  cleanText = cleanText.replace(/\s+/g, " ").trim();

  if (cleanText.length <= maxLength) return cleanText;

  // Truncate cleanly at word boundary
  const truncated = cleanText.substring(0, maxLength);
  return truncated.substring(0, Math.min(truncated.length, truncated.lastIndexOf(" "))) + "...";
}

/**
 * Normalizes title for Meta Tags
 */
export function generateSeoTitle(title: string | null | undefined, locale: string, fallbackTitle: string = ""): string {
  if (!title) return fallbackTitle;
  return title;
}

/**
 * Optimizes an image URL for SEO (OpenGraph & Schema) by passing it through Next.js Image Optimization.
 * Resizes the image to a standardized width to improve crawlability and social sharing performance.
 */
export function optimizeSeoImage(imageUrl: string | null | undefined, width: 1200 | 1080 | 1920 = 1200): string {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("/")) return `https://istanbulphotosession.com.tr${imageUrl}`;
  if (!imageUrl.startsWith("http")) return imageUrl;
  
  // Uses Next.js built-in optimizer for allowed remote patterns
  // 1200 is configured in next.config.ts deviceSizes
  return `https://istanbulphotosession.com.tr/_next/image?url=${encodeURIComponent(imageUrl)}&w=${width}&q=80`;
}

/**
 * Base open graph constructor helping out dynamic layouts.
 */
export function constructOpenGraph(
  title: string,
  description: string,
  imageUrl: string,
  siteName: string,
  locale: string
) {
  const optimizedUrl = optimizeSeoImage(imageUrl, 1200);

  return {
    title,
    description,
    url: "https://istanbulphotosession.com.tr", // Base URL handled by metadataBase in layout
    siteName: siteName || title,
    images: [
      {
        url: optimizedUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: locale === "tr" ? "tr_TR" : "en_US", // Simplify for main locales.
    type: "website",
  };
}

// ----------------------------------------------------
// SCHEMA.ORG (JSON-LD) GENERATORS
// ----------------------------------------------------

export function buildLocalBusinessSchema(settings: SiteSettings) {
  const imageUrl = optimizeSeoImage(settings.logo_url || settings.default_og_image_url, 1200);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.organization_name || settings.site_name,
    image: imageUrl,
    "@id": "https://istanbulphotosession.com.tr",
    url: "https://istanbulphotosession.com.tr",
    telephone: settings.contact_phone || settings.whatsapp_number,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Istanbul",
      addressCountry: "TR",
      streetAddress: settings.address?.en || "Istanbul",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.0082,
      longitude: 28.9784,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "06:00",
      closes: "22:00",
    },
    sameAs: [
      settings.instagram_url,
      settings.facebook_url,
      settings.youtube_url,
      settings.tiktok_url,
    ].filter(Boolean),
  };
}

export function buildProductSchema({
  name,
  description,
  image,
  price,
  currency = "EUR",
  aggregateRating,
  reviewCount,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  aggregateRating?: number;
  reviewCount?: number;
}) {
  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name,
    image: image ? optimizeSeoImage(image, 1200) : undefined,
    description,
    offers: {
      "@type": "Offer",
      url: "https://istanbulphotosession.com.tr",
      priceCurrency: currency,
      price: price,
      availability: "https://schema.org/InStock",
    },
  };

  // Only add AggregateRating if we have real data (Prevents schema validation errors)
  if (aggregateRating && aggregateRating > 0 && reviewCount && reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.toString(),
      reviewCount: reviewCount.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  return schema;
}

export function buildArticleSchema({
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
}: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    image: image ? [optimizeSeoImage(image, 1200)] : [],
    datePublished,
    dateModified,
    author: [
      {
        "@type": "Person",
        name: authorName,
      },
    ],
    description,
  };
}

export function buildFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  if (!faqs || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
