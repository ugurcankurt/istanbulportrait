import type { SiteSettings } from "./settings-service";

export function getBaseUrl() {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
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
  maxLength = 160,
): string | null {
  if (!content) return null;

  // 1. Remove HTML tags
  let cleanText = content.replace(/<[^>]*>?/gm, " ");
  // 2. Remove markdown/formatting chars if any
  cleanText = cleanText.replace(/[#*_~`>[\]()]/g, " ");
  // 3. Normalize whitespaces
  cleanText = cleanText.replace(/\s+/g, " ").trim();

  if (!cleanText) return null;

  if (cleanText.length <= maxLength) return cleanText;

  // Truncate cleanly at word boundary
  const truncated = cleanText.substring(0, maxLength);
  return `${truncated.substring(
    0,
    Math.min(truncated.length, truncated.lastIndexOf(" ")),
  )}...`;
}

/**
 * Normalizes title for Meta Tags
 */
export function generateSeoTitle(
  title: string | null | undefined,
  _locale: string,
  fallbackTitle: string = "",
): string {
  if (!title) return fallbackTitle;
  return title;
}

/**
 * Resolves an image URL for SEO (OpenGraph & Schema).
 * Uses Next.js /api/og dynamic image generation to guarantee a perfect 1200x630
 * aspect ratio for social media crawlers, avoiding cropped or improperly sized previews.
 */
export function optimizeSeoImage(
  imageUrl: string | null | undefined,
  width: 1200 | 1080 | 1920 = 1200,
): string {
  if (!imageUrl) return "";

  // Get absolute URL
  const absoluteUrl = imageUrl.startsWith("/")
    ? `${getBaseUrl()}${imageUrl}`
    : imageUrl;

  // Social media bots (WhatsApp, Facebook, LinkedIn) strictly require a JPEG/PNG format and often fail
  // to parse Next.js dynamic /_next/image endpoints emitting AVIF/WebP based on crawler headers.
  // Using wsrv.nl securely globally caches the image, guarantees a fixed JPG output format,
  // and optimally scales it for Open Graph requirements without cropping.
  return `https://wsrv.nl/?url=${encodeURIComponent(absoluteUrl)}&w=${width}&h=630&fit=cover&output=jpg&q=85`;
}

/**
 * Base open graph constructor helping out dynamic layouts.
 */
export function constructOpenGraph(
  title: string,
  description: string | null,
  imageUrl: string,
  siteName: string,
  locale: string,
  extraOverrides: any = {},
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
    ...extraOverrides,
  };
}

// ----------------------------------------------------
// SCHEMA.ORG (JSON-LD) GENERATORS
// ----------------------------------------------------

/**
 * Resolves an image URL for Schema.org JSON-LD structured data.
 * Guarantees a direct canonical URL served from this website (e.g. https://istanbulportrait.com/storage/...)
 * so Googlebot-Image crawls and associates the image directly with this domain,
 * free of third-party proxy canonicals or x-robots-tag penalties.
 */
export function resolveSchemaImage(
  imageUrl: string | null | undefined,
): string {
  if (!imageUrl) return "";

  const baseUrl = getBaseUrl();

  // Rewrite direct Supabase storage URLs to our canonical domain storage route
  const resolved = imageUrl.replace(
    "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public",
    `${baseUrl}/storage`,
  );

  // If already full http(s) URL
  if (resolved.startsWith("http://") || resolved.startsWith("https://")) {
    return resolved;
  }

  // If relative path
  if (resolved.startsWith("/")) {
    return `${baseUrl}${resolved}`;
  }

  return `${baseUrl}/${resolved}`;
}

export function buildLocalBusinessSchema(
  settings: SiteSettings,
  priceRange?: string,
  reviews?: any[],
  aggregateRatingValue?: number,
  reviewCount?: number,
  coverImage?: string,
  locale?: string,
  packages?: any[],
) {
  const imageUrl = resolveSchemaImage(
    coverImage || settings.logo_url || settings.default_og_image_url,
  );

  const localizedStreet =
    (locale && settings.address?.[locale]) ||
    settings.address?.en ||
    settings.city ||
    "Istanbul, Turkey";

  const schema: any = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.organization_name || settings.site_name,
    inLanguage: locale || "en",
    image: imageUrl
      ? {
          "@type": "ImageObject",
          url: imageUrl,
          contentUrl: imageUrl,
          width: 1200,
          height: 630,
          copyrightNotice: "IstanbulPortrait 2026",
          creator: { "@type": "Organization", name: "Istanbul Portrait" },
          creditText: "Istanbul Portrait",
          acquireLicensePage: `${getBaseUrl()}/en/contact`,
        }
      : undefined,
    "@id": `${getBaseUrl()}/#localbusiness`,
    url: `${getBaseUrl()}${locale ? `/${locale}` : ""}`,
    telephone: settings.contact_phone || settings.whatsapp_number,
    priceRange: priceRange || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: settings.city || "Istanbul",
      addressCountry: settings.country_code || "TR",
      streetAddress: localizedStreet,
      postalCode: "34116", // Default fallback if not defined elsewhere
    },
    geo:
      settings.latitude && settings.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: settings.latitude,
            longitude: settings.longitude,
          }
        : undefined,
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
      "https://www.linkedin.com/company/istanbulportrait",
    ].filter(Boolean),
  };

  if (
    aggregateRatingValue &&
    aggregateRatingValue > 0 &&
    reviewCount &&
    reviewCount > 0
  ) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRatingValue.toString(),
      reviewCount: reviewCount.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Include individual reviews with language tagging
  if (reviews && reviews.length > 0) {
    schema.review = reviews
      .filter((r: any) => r.text && r.text.trim().length > 0)
      .slice(0, 5)
      .map((r: any) => ({
        "@type": "Review",
        inLanguage: locale || "en",
        author: {
          "@type": "Person",
          name: r.author?.name || "Customer",
        },
        datePublished: r.date ? r.date.split("T")[0] : undefined,
        reviewBody: r.text,
        reviewRating: {
          "@type": "Rating",
          bestRating: "5",
          ratingValue: r.rating?.toString() || "5",
          worstRating: "1",
        },
      }));
  }

  // Include dynamic packages in OfferCatalog for rich snippet discovery and Google Image Pack indexing
  if (packages && packages.length > 0) {
    schema.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${settings.organization_name || settings.site_name} Photoshoot Packages`,
      itemListElement: packages.map((pkg: any) => {
        const pkgTitle =
          pkg.title?.[locale || "en"] || pkg.title?.en || pkg.slug;
        const pkgDesc =
          pkg.description?.[locale || "en"] || pkg.description?.en || "";
        const pkgCover =
          pkg.cover_image || pkg.gallery_images?.[0];
        const pkgImageUrl = resolveSchemaImage(pkgCover);
        const pkgUrl = `${getBaseUrl()}/${locale || "en"}/packages/${pkg.slug}`;

        return {
          "@type": "Offer",
          name: pkgTitle,
          url: pkgUrl,
          price: pkg.price,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          ...(pkgImageUrl ? { image: pkgImageUrl } : {}),
          itemOffered: {
            "@type": "Service",
            name: pkgTitle,
            description: generateSeoDescription(pkgDesc, 200),
            url: pkgUrl,
            ...(pkgImageUrl
              ? {
                  image: {
                    "@type": "ImageObject",
                    url: pkgImageUrl,
                    contentUrl: pkgImageUrl,
                    caption: pkgTitle,
                  },
                }
              : {}),
          },
        };
      }),
    };
  }

  return schema;
}

export function buildOrganizationSchema(settings: SiteSettings) {
  const imageUrl = resolveSchemaImage(
    settings.logo_url || settings.default_og_image_url,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.organization_name || settings.site_name,
    "@id": `${getBaseUrl()}/#organization`,
    url: getBaseUrl(),
    logo: imageUrl
      ? {
          "@type": "ImageObject",
          url: imageUrl,
          contentUrl: imageUrl,
          width: 1200,
          height: 630,
          copyrightNotice: "IstanbulPortrait 2026",
          creator: { "@type": "Organization", name: "Istanbul Portrait" },
          creditText: "Istanbul Portrait",
          acquireLicensePage: `${getBaseUrl()}/en/contact`,
        }
      : undefined,
    image: imageUrl
      ? {
          "@type": "ImageObject",
          url: imageUrl,
          contentUrl: imageUrl,
          width: 1200,
          height: 630,
          copyrightNotice: "IstanbulPortrait 2026",
          creator: { "@type": "Organization", name: "Istanbul Portrait" },
          creditText: "Istanbul Portrait",
          acquireLicensePage: `${getBaseUrl()}/en/contact`,
        }
      : undefined,
    founder: settings.founder_name
      ? {
          "@type": "Person",
          name: settings.founder_name,
          ...(settings.founder_image_url
            ? {
                image: {
                  "@type": "ImageObject",
                  url: resolveSchemaImage(settings.founder_image_url),
                  contentUrl: resolveSchemaImage(settings.founder_image_url),
                  width: 1200,
                  height: 630,
                  copyrightNotice: "IstanbulPortrait 2026",
                  creator: {
                    "@type": "Organization",
                    name: "Istanbul Portrait",
                  },
                  creditText: "Istanbul Portrait",
                  acquireLicensePage: `${getBaseUrl()}/en/contact`,
                },
              }
            : {}),
        }
      : undefined,
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
      "https://www.linkedin.com/company/istanbulportrait",
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
  url,
}: {
  name: string;
  description: string | null;
  image: string;
  price: number;
  currency?: string;
  aggregateRating?: number;
  reviewCount?: number;
  providerName?: string | null;
  providerUrl?: string;
  discount?: { discount_percentage: number; end_date?: string } | null;
  reviews?: any[];
  url?: string;
}) {
  const finalPrice =
    discount && discount.discount_percentage > 0
      ? price - (price * discount.discount_percentage) / 100
      : price;

  const schemaImageUrl = resolveSchemaImage(image);

  const schema: any = {
    "@context": "https://schema.org/",
    "@type": "Product",
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
    url: url,
    name,
    image: schemaImageUrl
      ? {
          "@type": "ImageObject",
          url: schemaImageUrl,
          contentUrl: schemaImageUrl,
          width: 1200,
          height: 630,
          copyrightNotice: "IstanbulPortrait 2026",
          creator: { "@type": "Organization", name: "Istanbul Portrait" },
          creditText: "Istanbul Portrait",
          acquireLicensePage: `${getBaseUrl()}/en/contact`,
        }
      : undefined,
    description: description || undefined,
    brand: providerName
      ? {
          "@type": "Brand",
          name: providerName,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      url: providerUrl || getBaseUrl(),
      priceCurrency: currency,
      price: finalPrice,
      availability: "https://schema.org/InStock",
      validFrom: `${new Date().getFullYear()}-01-01`,
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: currency,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "TR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "d",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "d",
          },
        },
      },
      seller: providerName
        ? {
            "@type": "Organization",
            name: providerName,
          }
        : undefined,
    },
  };

  if (discount && discount.discount_percentage > 0) {
    const specs: any[] = [];

    // Add original price as StrikethroughPrice
    specs.push({
      "@type": "UnitPriceSpecification",
      priceType: "https://schema.org/StrikethroughPrice",
      price: price,
      priceCurrency: currency,
    });

    if (discount.end_date) {
      schema.offers.priceValidUntil = discount.end_date.split("T")[0]; // YYYY-MM-DD
    }

    schema.offers.priceSpecification = specs;
  }

  if (
    aggregateRating &&
    aggregateRating > 0 &&
    reviewCount &&
    reviewCount > 0
  ) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.toString(),
      reviewCount: reviewCount.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  if (reviews && reviews.length > 0) {
    schema.review = reviews.slice(0, 5).map((r: any) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.author?.name || "Customer",
      },
      datePublished: r.date ? r.date.split("T")[0] : undefined,
      reviewBody: r.text,
      reviewRating: {
        "@type": "Rating",
        bestRating: "5",
        ratingValue: r.rating?.toString() || "5",
        worstRating: "1",
      },
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
  authorImage,
  authorBio,
  publisherName,
  publisherLogo,
  inLanguage,
  keywords,
  url,
}: {
  title: string;
  description: string | null;
  image: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  authorUrls?: string[];
  authorImage?: string;
  authorBio?: string;
  publisherName?: string;
  publisherLogo?: string;
  inLanguage?: string;
  keywords?: string[];
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
    url: url,
    headline: title,
    inLanguage: inLanguage,
    image: image
      ? [
          {
            "@type": "ImageObject",
            url: resolveSchemaImage(image),
            contentUrl: resolveSchemaImage(image),
            width: 1200,
            height: 630,
            copyrightNotice: "IstanbulPortrait 2026",
            creator: { "@type": "Organization", name: "Istanbul Portrait" },
            creditText: "Istanbul Portrait",
            acquireLicensePage: `${getBaseUrl()}/en/contact`,
          },
        ]
      : [],
    datePublished,
    dateModified,
    author: [
      {
        "@type": "Person",
        name: authorName,
        ...(authorImage ? { image: authorImage } : {}),
        ...(authorBio ? { description: authorBio } : {}),
        ...(authorUrls && authorUrls.length > 0 ? { sameAs: authorUrls } : {}),
      },
    ],
    publisher: publisherName
      ? {
          "@type": "Organization",
          name: publisherName,
          ...(publisherLogo
            ? {
                logo: {
                  "@type": "ImageObject",
                  url: resolveSchemaImage(publisherLogo),
                  contentUrl: resolveSchemaImage(publisherLogo),
                  width: 1200,
                  height: 630,
                  copyrightNotice: "IstanbulPortrait 2026",
                  creator: {
                    "@type": "Organization",
                    name: "Istanbul Portrait",
                  },
                  creditText: "Istanbul Portrait",
                  acquireLicensePage: `${getBaseUrl()}/en/contact`,
                },
              }
            : {}),
        }
      : undefined,
    description: description || undefined,
    ...(keywords && keywords.length > 0
      ? { keywords: keywords.join(", ") }
      : {}),
  };
}

export function buildFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
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

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  if (!items || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${getBaseUrl()}${item.url}`,
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
  description: string | null;
  image?: string;
  lat?: number;
  lng?: number;
  url?: string;
}) {
  const schemaImageUrl = resolveSchemaImage(image);

  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
    name,
    description,
    url: url || getBaseUrl(),
    image: schemaImageUrl
      ? {
          "@type": "ImageObject",
          url: schemaImageUrl,
          contentUrl: schemaImageUrl,
          width: 1200,
          height: 630,
          copyrightNotice: "IstanbulPortrait 2026",
          creator: { "@type": "Organization", name: "Istanbul Portrait" },
          creditText: "Istanbul Portrait",
          acquireLicensePage: `${getBaseUrl()}/en/contact`,
        }
      : undefined,
    geo:
      lat && lng
        ? {
            "@type": "GeoCoordinates",
            latitude: lat,
            longitude: lng,
          }
        : undefined,
  };
}

export function buildAboutPageSchema({
  name,
  description,
  url,
  organizationSchema,
}: {
  name: string;
  description: string | null;
  url?: string;
  organizationSchema?: any;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
    name,
    description: description || undefined,
    url: url || getBaseUrl(),
    ...(organizationSchema ? { mainEntity: organizationSchema } : {}),
  };
}

export function buildContactPageSchema({
  name,
  description,
  url,
}: {
  name: string;
  description: string | null;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
    name,
    description: description || undefined,
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
  description: string | null;
  url?: string;
  items: Array<{
    name: string;
    description?: string | null;
    url: string;
    image?: string;
  }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    mainEntityOfPage: url
      ? {
          "@type": "WebPage",
          "@id": url,
        }
      : undefined,
    name,
    description: description || undefined,
    url: url || getBaseUrl(),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => {
        const itemImageUrl = resolveSchemaImage(item.image);
        return {
          "@type": "ListItem",
          position: index + 1,
          url: item.url,
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(itemImageUrl
            ? {
                image: {
                  "@type": "ImageObject",
                  url: itemImageUrl,
                  contentUrl: itemImageUrl,
                  width: 1200,
                  height: 630,
                  copyrightNotice: "IstanbulPortrait 2026",
                  creator: {
                    "@type": "Organization",
                    name: "Istanbul Portrait",
                  },
                  creditText: "Istanbul Portrait",
                  acquireLicensePage: `${getBaseUrl()}/en/contact`,
                },
              }
            : {}),
        };
      }),
    },
  };
}

export function buildImageGallerySchema({
  name,
  description,
  url,
  images,
}: {
  name: string;
  description?: string;
  url: string;
  images: Array<{
    url: string;
    caption?: string;
  }>;
}) {
  if (!images || images.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name,
    description: description || undefined,
    url: url || getBaseUrl(),
    image: images.map((img) => {
      const cleanUrl = resolveSchemaImage(img.url);
      return {
        "@type": "ImageObject",
        contentUrl: cleanUrl,
        url: cleanUrl,
        caption: img.caption || name,
        copyrightNotice: "IstanbulPortrait 2026",
        creator: { "@type": "Organization", name: "Istanbul Portrait" },
        creditText: "Istanbul Portrait",
        acquireLicensePage: `${getBaseUrl()}/contact`,
      };
    }),
  };
}
