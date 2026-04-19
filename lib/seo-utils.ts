import { SiteSettings } from "./settings-service";

export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "https://istanbulportrait.com";
}

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
 * Resolves an image URL for SEO (OpenGraph & Schema).
 * Uses Next.js /api/og dynamic image generation to guarantee a perfect 1200x630
 * aspect ratio for social media crawlers, avoiding cropped or improperly sized previews.
 */
export function optimizeSeoImage(imageUrl: string | null | undefined, width: 1200 | 1080 | 1920 = 1200): string {
  if (!imageUrl) return "";

  // Get absolute URL
  const absoluteUrl = imageUrl.startsWith("/")
    ? `${getBaseUrl()}${imageUrl}`
    : imageUrl;

  // Vercel Native Endpoint: We use Next.js's built-in image optimizer (`/_next/image`).
  // By passing `w=width` without forcing a height or crop geometry, Vercel natively rescales
  // the image down to compress it, while preserving the original aspect ratio (NO CROPPING).
  // Furthermore, Vercel automatically detects the Bot/Crawler's "Accept" header and serves
  // JPG/PNG instead of WebP if the social media crawler doesn't support modern formats.
  return `${getBaseUrl()}/_next/image?url=${encodeURIComponent(absoluteUrl)}&w=${width}&q=85`;
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

  const ogLocaleMap: Record<string, string> = {
    en: "en_US",
    ar: "ar_SA",
    tr: "tr_TR",
    ru: "ru_RU",
    es: "es_ES",
    zh: "zh_CN",
    fr: "fr_FR",
    de: "de_DE",
    ro: "ro_RO",
  };
  const ogLocale = ogLocaleMap[locale] || "en_US";

  return {
    title,
    description,
    url: getBaseUrl(), // Base URL handled by metadataBase in layout
    siteName: siteName || title,
    images: [
      {
        url: optimizedUrl,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: ogLocale,
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
    image: imageUrl ? {
        "@type": "ImageObject",
        url: imageUrl,
        width: 1200,
        height: 630,
    } : undefined,
    "@id": getBaseUrl(),
    url: getBaseUrl(),
    telephone: settings.contact_phone || settings.whatsapp_number,
    address: {
      "@type": "PostalAddress",
      addressLocality: settings.city || "",
      addressCountry: settings.country_code || "",
      streetAddress: settings.address?.en || settings.city || "",
    },
    geo: (settings.latitude && settings.longitude) ? {
      "@type": "GeoCoordinates",
      latitude: settings.latitude,
      longitude: settings.longitude,
    } : undefined,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: settings.working_days || [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: settings.opening_time || "06:00",
      closes: settings.closing_time || "22:00",
    },
    sameAs: [
      settings.instagram_url,
      settings.facebook_url,
      settings.youtube_url,
      settings.tiktok_url,
    ].filter(Boolean),
  };
}

export function buildOrganizationSchema(settings: SiteSettings) {
  const imageUrl = optimizeSeoImage(settings.logo_url || settings.default_og_image_url, 1200);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.organization_name || settings.site_name,
    "@id": getBaseUrl() + "/#organization",
    url: getBaseUrl(),
    logo: imageUrl ? {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630
    } : undefined,
    image: imageUrl ? {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630
    } : undefined,
    founder: settings.founder_name ? {
      "@type": "Person",
      name: settings.founder_name,
      ...(settings.founder_image_url ? {
        image: {
          "@type": "ImageObject",
          url: optimizeSeoImage(settings.founder_image_url, 1200),
          width: 1200,
          height: 630
        }
      } : {})
    } : undefined,
    foundingDate: settings.organization_founding_date || undefined,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: settings.contact_phone || settings.whatsapp_number,
      contactType: "customer service",
      email: settings.contact_email,
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
    image: image ? {
      "@type": "ImageObject",
      url: optimizeSeoImage(image, 1200),
      width: 1200,
      height: 630,
    } : undefined,
    description,
    offers: {
      "@type": "Offer",
      url: getBaseUrl(),
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
  authorUrls,
  publisherName,
  publisherLogo,
}: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrls?: string[];
  publisherName?: string;
  publisherLogo?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    image: image ? [{
      "@type": "ImageObject",
      url: optimizeSeoImage(image, 1200),
      width: 1200,
      height: 630,
    }] : [],
    datePublished,
    dateModified,
    author: [
      {
        "@type": "Person",
        name: authorName,
        ...(authorUrls && authorUrls.length > 0 ? { sameAs: authorUrls } : {}),
      },
    ],
    publisher: publisherName ? {
      "@type": "Organization",
      name: publisherName,
      ...(publisherLogo ? {
        logo: {
          "@type": "ImageObject",
          url: optimizeSeoImage(publisherLogo, 1200),
          width: 1200,
          height: 630,
        },
      } : {}),
    } : undefined,
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

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  if (!items || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${getBaseUrl()}${item.url}`,
    })),
  };
}
