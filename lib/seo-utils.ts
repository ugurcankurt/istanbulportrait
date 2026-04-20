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

  // Social media bots (WhatsApp, Facebook, LinkedIn) strictly require a JPEG/PNG format and often fail
  // to parse Next.js dynamic /_next/image endpoints emitting AVIF/WebP based on crawler headers.
  // Using wsrv.nl securely globally caches the image, guarantees a fixed JPG output format, 
  // and optimally scales it for Open Graph requirements without cropping.
  return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${width}&output=jpg&q=85`;
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

export function buildLocalBusinessSchema(settings: SiteSettings, priceRange?: string, reviews?: any[]) {
  const imageUrl = optimizeSeoImage(settings.logo_url || settings.default_og_image_url, 1200);

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.organization_name || settings.site_name,
    image: imageUrl ? {
        "@type": "ImageObject",
        url: imageUrl,
        width: 1200,
        height: 630,
        copyrightNotice: "IstanbulPortrait 2026",
        creator: { "@type": "Organization", name: "Istanbul Portrait" }
    } : undefined,
    "@id": getBaseUrl(),
    url: getBaseUrl(),
    telephone: settings.contact_phone || settings.whatsapp_number,
    priceRange: priceRange || undefined,
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

  if (reviews && reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map((r: any) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": r.author?.name || "Customer"
      },
      "datePublished": r.date ? r.date.split("T")[0] : undefined,
      "reviewBody": r.text,
      "reviewRating": {
        "@type": "Rating",
        "bestRating": "5",
        "ratingValue": r.rating?.toString() || "5",
        "worstRating": "1"
      }
    }));
  }

  return schema;
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

export function buildServiceSchema({
  name,
  description,
  image,
  price,
  currency = "EUR",
  aggregateRating,
  reviewCount,
  providerName,
  providerUrl,
  discount,
  reviews,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  aggregateRating?: number;
  reviewCount?: number;
  providerName?: string | null;
  providerUrl?: string;
  discount?: { discount_percentage: number; end_date?: string } | null;
  reviews?: any[];
}) {
  const finalPrice = discount && discount.discount_percentage > 0 
    ? price - (price * discount.discount_percentage / 100) 
    : price;

  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Service",
    name,
    image: image ? {
      "@type": "ImageObject",
      url: optimizeSeoImage(image, 1200),
      width: 1200,
      height: 630,
      copyrightNotice: "IstanbulPortrait 2026",
      creator: { "@type": "Organization", name: "Istanbul Portrait" }
    } : undefined,
    description,
    provider: providerName ? {
      "@type": "LocalBusiness",
      name: providerName,
      ...(providerUrl ? { url: providerUrl } : {})
    } : undefined,
    offers: {
      "@type": "Offer",
      url: providerUrl || getBaseUrl(),
      priceCurrency: currency,
      price: finalPrice,
      availability: "https://schema.org/InStock",
    },
  };

  if (discount && discount.discount_percentage > 0) {
    const specs: any[] = [];
    
    // Add original price as StrikethroughPrice
    specs.push({
      "@type": "UnitPriceSpecification",
      priceType: "https://schema.org/StrikethroughPrice",
      price: price,
      priceCurrency: currency
    });

    if (discount.end_date) {
      schema.offers.priceValidUntil = discount.end_date.split("T")[0]; // YYYY-MM-DD
    }

    schema.offers.priceSpecification = specs;
  }

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

  if (reviews && (reviews as any[]).length > 0) {
    schema.review = (reviews as any[]).slice(0, 5).map((r: any) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": r.author?.name || "Customer"
      },
      "datePublished": r.date ? r.date.split("T")[0] : undefined,
      "reviewBody": r.text,
      "reviewRating": {
        "@type": "Rating",
        "bestRating": "5",
        "ratingValue": r.rating?.toString() || "5",
        "worstRating": "1"
      }
    }));
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
  inLanguage,
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
  inLanguage?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    inLanguage: inLanguage,
    image: image ? [{
      "@type": "ImageObject",
      url: optimizeSeoImage(image, 1200),
      width: 1200,
      height: 630,
      copyrightNotice: "IstanbulPortrait 2026",
      creator: { "@type": "Organization", name: "Istanbul Portrait" }
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

export function buildTouristAttractionSchema({
  name,
  description,
  image,
  lat,
  lng,
  url,
}: {
  name: string;
  description: string;
  image?: string;
  lat?: number;
  lng?: number;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name,
    description,
    url: url || getBaseUrl(),
    image: image ? {
      "@type": "ImageObject",
      url: optimizeSeoImage(image, 1200),
      width: 1200,
      height: 630,
      copyrightNotice: "IstanbulPortrait 2026",
      creator: { "@type": "Organization", name: "Istanbul Portrait" }
    } : undefined,
    geo: (lat && lng) ? {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    } : undefined,
  };
}

export function buildAboutPageSchema({
  name,
  description,
  url,
  organizationSchema,
}: {
  name: string;
  description: string;
  url?: string;
  organizationSchema?: any;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name,
    description,
    url: url || getBaseUrl(),
    ...(organizationSchema ? { mainEntity: organizationSchema } : {})
  };
}

export function buildContactPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name,
    description,
    url: url || getBaseUrl(),
  };
}

export function buildCollectionPageSchema({
  name,
  description,
  url,
  items,
}: {
  name: string;
  description: string;
  url?: string;
  items: Array<{
    name: string;
    description?: string;
    url: string;
    image?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: url || getBaseUrl(),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: item.url,
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(item.image ? { image: optimizeSeoImage(item.image, 1200) } : {}),
      })),
    },
  };
}
