"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { SEO_CONFIG } from "@/lib/seo-config";

/**
 * SEO Utility Hook for Istanbul Portrait
 * Provides easy access to SEO data and utilities
 */

export interface SEOData {
  title: string;
  description: string;
  url: string;
  canonical: string;
  ogImage: string;
  keywords: string[];
  locale: string;
  alternateUrls: Record<string, string>;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function useSEO(pageData?: {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
}): SEOData {
  const pathname = usePathname();
  const locale = useLocale();

  // Clean pathname for URL generation
  const cleanPathname = pathname.replace(`/${locale}`, "") || "/";

  // Generate base URL
  const baseUrl = SEO_CONFIG.site.url;
  const currentUrl = `${baseUrl}/${locale}${cleanPathname === "/" ? "" : cleanPathname}`;

  // Generate canonical URL (default to English)
  const canonicalUrl = `${baseUrl}/en${cleanPathname === "/" ? "" : cleanPathname}`;

  // Generate alternate URLs for all supported locales
  const alternateUrls = {
    en: `${baseUrl}/en${cleanPathname === "/" ? "" : cleanPathname}`,
    ar: `${baseUrl}/ar${cleanPathname === "/" ? "" : cleanPathname}`,
    ru: `${baseUrl}/ru${cleanPathname === "/" ? "" : cleanPathname}`,
    es: `${baseUrl}/es${cleanPathname === "/" ? "" : cleanPathname}`,
  };

  // Merge page-specific data with defaults
  const title = pageData?.title || SEO_CONFIG.site.title;
  const description = pageData?.description || SEO_CONFIG.site.description;
  const keywords = pageData?.keywords
    ? [...SEO_CONFIG.seo.keywords, ...pageData.keywords]
    : [...SEO_CONFIG.seo.keywords];
  const ogImage = pageData?.image || SEO_CONFIG.images.ogImage;

  return {
    title,
    description,
    url: currentUrl,
    canonical: canonicalUrl,
    ogImage,
    keywords,
    locale,
    alternateUrls,
  };
}

/**
 * Hook for generating breadcrumb data
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const locale = useLocale();

  // Remove locale from pathname for processing
  const cleanPathname = pathname.replace(`/${locale}`, "") || "/";

  const breadcrumbs: BreadcrumbItem[] = [{ name: "Home", url: "/" }];

  if (cleanPathname === "/") return breadcrumbs;

  // Split path and build breadcrumb chain
  const pathSegments = cleanPathname.split("/").filter(Boolean);

  pathSegments.forEach((segment, index) => {
    const url = "/" + pathSegments.slice(0, index + 1).join("/");
    const name = segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ name, url });
  });

  return breadcrumbs;
}

/**
 * Hook for generating structured data based on current page
 */
export function usePageSchema() {
  const pathname = usePathname();
  const locale = useLocale();
  const seoData = useSEO();
  const breadcrumbs = useBreadcrumbs();

  // Determine page type based on pathname
  const cleanPathname = pathname.replace(`/${locale}`, "") || "/";

  const getPageType = () => {
    if (cleanPathname === "/") return "homepage";
    if (cleanPathname.includes("/packages")) return "packages";
    if (cleanPathname.includes("/about")) return "about";
    if (cleanPathname.includes("/contact")) return "contact";
    if (cleanPathname.includes("/checkout")) return "checkout";
    if (cleanPathname.includes("/privacy")) return "privacy";
    return "page";
  };

  const pageType = getPageType();

  // Generate page-specific schema data
  const getSchemaData = () => {
    const baseData = {
      title: seoData.title,
      description: seoData.description,
      url: cleanPathname,
      breadcrumb: {
        items: breadcrumbs,
      },
    };

    switch (pageType) {
      case "homepage":
        return {
          ...baseData,
          mainEntity: {
            "@type": "Organization",
            name: SEO_CONFIG.organization.name,
          },
          about: {
            "@type": "Service",
            name: "Professional Photography Services",
          },
          mentions: [
            { "@type": "City", name: "Istanbul" },
            { "@type": "Service", name: "Portrait Photography" },
            { "@type": "Service", name: "Couple Photography" },
          ],
        };

      case "packages":
        return {
          ...baseData,
          mainEntity: {
            "@type": "Service",
            name: SEO_CONFIG.services.name,
          },
          about: {
            "@type": "Offer",
            name: "Photography Packages",
          },
        };

      case "about":
        return {
          ...baseData,
          mainEntity: {
            "@type": "Person",
            name: SEO_CONFIG.person.name,
          },
          about: {
            "@type": "Person",
            name: SEO_CONFIG.person.name,
          },
        };

      case "contact":
        return {
          ...baseData,
          mainEntity: {
            "@type": "ContactPage",
            name: "Contact Istanbul Portrait",
          },
        };

      default:
        return baseData;
    }
  };

  return {
    pageType,
    schemaData: getSchemaData(),
    shouldIncludeOrganization: true,
    shouldIncludePerson: ["about", "homepage"].includes(pageType),
    shouldIncludeService: ["packages", "homepage"].includes(pageType),
    shouldIncludeWebsite: pageType === "homepage",
  };
}

/**
 * Hook for generating FAQ schema data
 */
export function useFAQSchema(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    faqs: faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
  };
}

/**
 * Hook for generating offer schema data for packages
 */
export function usePackageOfferSchema(packageData: {
  id: string;
  name: string;
  price: string;
  description: string;
  duration?: string;
  photos?: string;
  locations?: string;
}) {
  return {
    name: packageData.name,
    description: `${packageData.duration} photoshoot with ${packageData.photos} and ${packageData.locations}. ${packageData.description}`,
    price: packageData.price.replace(/[€$]/g, ""),
    priceCurrency: "EUR",
    url: `/packages#${packageData.id}`,
    packageId: packageData.id,
    serviceName: `${packageData.name} Photography Package`,
    brand: SEO_CONFIG.organization.name,
    seller: SEO_CONFIG.organization.name,
    availability: "in stock",
    category: "Photography Services",
    validFrom: new Date().toISOString().split("T")[0],
  };
}

/**
 * Hook for generating review schema data
 */
export function useReviewSchema(
  reviews: Array<{
    author: string;
    rating: number;
    review: string;
    date: string;
  }>,
) {
  return reviews.map((review) => ({
    author: review.author,
    rating: review.rating,
    review: review.review,
    date: review.date,
  }));
}

/**
 * Hook for generating image gallery schema data
 */
export function useGallerySchema(
  images: Array<{
    url: string;
    caption?: string;
    description?: string;
  }>,
) {
  return {
    name: "Istanbul Photography Gallery",
    description:
      "Professional photography gallery showcasing Istanbul photoshoot sessions by experienced photographer",
    images: images.map((image) => ({
      url: image.url,
      caption: image.caption,
      description: image.description,
    })),
  };
}

export default useSEO;
