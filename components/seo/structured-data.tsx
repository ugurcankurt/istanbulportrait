"use client";

import Script from "next/script";
import { SEO_CONFIG } from "@/lib/seo-config";

/**
 * Schema.org Types for Istanbul Portrait Photography
 */

// Base Schema Types
export interface BaseSchema {
  "@context": "https://schema.org";
  "@type": string;
}

// Organization Schema
export interface OrganizationSchema extends BaseSchema {
  "@type": "Organization" | "LocalBusiness" | "ProfessionalService";
  name: string;
  url: string;
  logo?: string;
  image?: string[];
  description?: string;
  address?: {
    "@type": "PostalAddress";
    addressCountry: string;
    addressLocality: string;
    addressRegion?: string;
    streetAddress?: string;
    postalCode?: string;
  };
  contactPoint?: {
    "@type": "ContactPoint";
    telephone: string;
    contactType: string;
    areaServed: string;
    availableLanguage: string[];
  };
  sameAs?: string[];
  openingHours?: string[];
  priceRange?: string;
  paymentAccepted?: string[];
  currenciesAccepted?: string;
}

// Person Schema
export interface PersonSchema extends BaseSchema {
  "@type": "Person";
  name: string;
  url?: string;
  image?: string;
  jobTitle?: string;
  worksFor?: {
    "@type": "Organization";
    name: string;
  };
  sameAs?: string[];
  knowsAbout?: string[];
}

// Service Schema
export interface ServiceSchema extends BaseSchema {
  "@type": "Service";
  name: string;
  description: string;
  provider: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  areaServed: string;
  serviceType: string[];
  offers?: OfferSchema[];
}

// Offer Schema
export interface OfferSchema extends BaseSchema {
  "@type": "Offer";
  name: string;
  description: string;
  price: string;
  priceCurrency: string;
  url?: string;
  availability?: string;
  validFrom?: string;
  validThrough?: string;
  seller?: {
    "@type": "Organization";
    name: string;
  };
  category?: string;
  sku?: string;
}

// FAQ Schema
export interface FAQSchema extends BaseSchema {
  "@type": "FAQPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }[];
}

// Breadcrumb Schema
export interface BreadcrumbSchema extends BaseSchema {
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }[];
}

// ImageGallery Schema
export interface ImageGallerySchema extends BaseSchema {
  "@type": "ImageGallery";
  name: string;
  description: string;
  creator: {
    "@type": "Person";
    name: string;
  };
  associatedMedia: {
    "@type": "ImageObject";
    contentUrl: string;
    caption?: string;
    description?: string;
  }[];
}

// Review Schema
export interface ReviewSchema extends BaseSchema {
  "@type": "Review";
  reviewRating: {
    "@type": "Rating";
    ratingValue: number;
    bestRating: number;
  };
  author: {
    "@type": "Person";
    name: string;
  };
  reviewBody: string;
  datePublished: string;
  itemReviewed: {
    "@type": "Service" | "Organization";
    name: string;
  };
}

// WebSite Schema
export interface WebSiteSchema extends BaseSchema {
  "@type": "WebSite";
  name: string;
  url: string;
  description: string;
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
  potentialAction?: {
    "@type": "SearchAction";
    target: {
      "@type": "EntryPoint";
      urlTemplate: string;
    };
    "query-input": string;
  };
  sameAs?: string[];
}

// WebPage Schema
export interface WebPageSchema extends BaseSchema {
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  mainEntity?: any;
  breadcrumb?: BreadcrumbSchema;
  isPartOf: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
  about?: {
    "@type": string;
    name: string;
  };
  mentions?: {
    "@type": string;
    name: string;
  }[];
}

// Union type for all schema types
export type SchemaData =
  | OrganizationSchema
  | PersonSchema
  | ServiceSchema
  | OfferSchema
  | FAQSchema
  | BreadcrumbSchema
  | ImageGallerySchema
  | ReviewSchema
  | WebSiteSchema
  | WebPageSchema;

/**
 * Structured Data Component Props
 */
export interface StructuredDataProps {
  type:
    | "organization"
    | "person"
    | "service"
    | "offer"
    | "faq"
    | "breadcrumb"
    | "gallery"
    | "review"
    | "website"
    | "webpage"
    | "custom";
  data?: any;
  children?: React.ReactNode;
}

/**
 * Generate Organization Schema
 */
function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SEO_CONFIG.organization.name,
    url: SEO_CONFIG.organization.url,
    logo: SEO_CONFIG.organization.logo,
    image: [...SEO_CONFIG.images.gallery],
    description: SEO_CONFIG.site.description,
    address: SEO_CONFIG.organization.address,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SEO_CONFIG.organization.contactPoint.telephone,
      contactType: SEO_CONFIG.organization.contactPoint.contactType,
      areaServed: SEO_CONFIG.organization.contactPoint.areaServed,
      availableLanguage: [
        ...SEO_CONFIG.organization.contactPoint.availableLanguage,
      ],
    },
    sameAs: [...SEO_CONFIG.organization.sameAs],
    openingHours: [...SEO_CONFIG.business.openingHours],
    priceRange: SEO_CONFIG.business.priceRange,
    paymentAccepted: [...SEO_CONFIG.business.paymentAccepted],
    currenciesAccepted: SEO_CONFIG.business.currenciesAccepted,
  };
}

/**
 * Generate Person Schema
 */
function generatePersonSchema(): PersonSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SEO_CONFIG.person.name,
    url: SEO_CONFIG.person.url,
    image: SEO_CONFIG.person.image,
    jobTitle: SEO_CONFIG.person.jobTitle,
    worksFor: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
    },
    sameAs: [...SEO_CONFIG.person.sameAs],
    knowsAbout: [
      "Photography",
      "Portrait Photography",
      "Professional Photography",
      "Istanbul Tourism",
      "Photo Editing",
      "Digital Photography",
    ],
  };
}

/**
 * Generate Service Schema
 */
function generateServiceSchema(): ServiceSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: SEO_CONFIG.services.name,
    description: SEO_CONFIG.services.description,
    provider: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      url: SEO_CONFIG.organization.url,
    },
    areaServed: SEO_CONFIG.services.areaServed,
    serviceType: [...SEO_CONFIG.services.serviceType],
    offers: SEO_CONFIG.services.offers.map((offer) => ({
      "@context": "https://schema.org",
      "@type": "Offer",
      name: offer.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
      },
      category: "Photography Services",
    })),
  };
}

/**
 * Generate Website Schema
 */
function generateWebSiteSchema(): WebSiteSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_CONFIG.site.name,
    url: SEO_CONFIG.site.url,
    description: SEO_CONFIG.site.description,
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      logo: {
        "@type": "ImageObject",
        url: SEO_CONFIG.organization.logo,
      },
    },
    sameAs: [...SEO_CONFIG.organization.sameAs],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SEO_CONFIG.site.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Offer Schema
 */
function generateOfferSchema(data: any): OfferSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: data.name,
    description: data.description,
    price: data.price,
    priceCurrency: data.priceCurrency || "EUR",
    url: data.url ? `${SEO_CONFIG.site.url}${data.url}` : SEO_CONFIG.site.url,
    availability: data.availability || "https://schema.org/InStock",
    validFrom: data.validFrom,
    validThrough: data.validThrough,
    seller: {
      "@type": "Organization",
      name: data.seller || SEO_CONFIG.organization.name,
    },
    category: data.category || "Photography Services",
    sku: data.packageId,
  };
}

/**
 * Generate FAQ Schema
 */
function generateFAQSchema(data: any): FAQSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity:
      data.faqs?.map((faq: any) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })) || [],
  };
}

/**
 * Generate Breadcrumb Schema
 */
function generateBreadcrumbSchema(data: any): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement:
      data.items?.map((item: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${SEO_CONFIG.site.url}${item.url}`,
      })) || [],
  };
}

/**
 * Generate Image Gallery Schema
 */
function generateImageGallerySchema(data: any): ImageGallerySchema {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: data.name || "Istanbul Photography Gallery",
    description:
      data.description ||
      "Professional photography gallery showcasing Istanbul photoshoot sessions",
    creator: {
      "@type": "Person",
      name: SEO_CONFIG.person.name,
    },
    associatedMedia:
      data.images?.map((image: any) => ({
        "@type": "ImageObject",
        contentUrl: image.url,
        caption: image.caption,
        description: image.description,
      })) || [],
  };
}

/**
 * Generate Review Schema
 */
function generateReviewSchema(data: any): ReviewSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: data.rating,
      bestRating: 5,
    },
    author: {
      "@type": "Person",
      name: data.author,
    },
    reviewBody: data.review,
    datePublished: data.date,
    itemReviewed: {
      "@type": "Service",
      name: SEO_CONFIG.services.name,
    },
  };
}

/**
 * Generate WebPage Schema
 */
function generateWebPageSchema(data: any): WebPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: data.title,
    description: data.description,
    url: `${SEO_CONFIG.site.url}${data.url || ""}`,
    mainEntity: data.mainEntity,
    breadcrumb: data.breadcrumb,
    isPartOf: {
      "@type": "WebSite",
      name: SEO_CONFIG.site.name,
      url: SEO_CONFIG.site.url,
    },
    about: data.about,
    mentions: data.mentions,
  };
}

/**
 * Main StructuredData Component
 */
export function StructuredData({ type, data, children }: StructuredDataProps) {
  let schemaData: SchemaData | null = null;

  switch (type) {
    case "organization":
      schemaData = generateOrganizationSchema();
      break;
    case "person":
      schemaData = generatePersonSchema();
      break;
    case "service":
      schemaData = generateServiceSchema();
      break;
    case "offer":
      schemaData = generateOfferSchema(data);
      break;
    case "faq":
      schemaData = generateFAQSchema(data);
      break;
    case "breadcrumb":
      schemaData = generateBreadcrumbSchema(data);
      break;
    case "gallery":
      schemaData = generateImageGallerySchema(data);
      break;
    case "review":
      schemaData = generateReviewSchema(data);
      break;
    case "website":
      schemaData = generateWebSiteSchema();
      break;
    case "webpage":
      schemaData = generateWebPageSchema(data);
      break;
    case "custom":
      schemaData = data;
      break;
    default:
      console.warn(`Unknown schema type: ${type}`);
      return null;
  }

  if (!schemaData) return null;

  return (
    <>
      <Script
        id={`schema-${type}-${Math.random().toString(36).substring(2, 11)}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData, null, 2),
        }}
      />
      {children}
    </>
  );
}

/**
 * Pre-configured Schema Components for easy usage
 */

export function OrganizationStructuredData() {
  return <StructuredData type="organization" />;
}

export function PersonStructuredData() {
  return <StructuredData type="person" />;
}

export function ServiceStructuredData() {
  return <StructuredData type="service" />;
}

export function WebSiteStructuredData() {
  return <StructuredData type="website" />;
}

/**
 * Higher Order Component for automatic page schema
 */
export function withPageSchema<T extends object>(
  Component: React.ComponentType<T>,
  pageData: {
    title: string;
    description: string;
    url: string;
    breadcrumb?: any;
    mainEntity?: any;
  },
) {
  return function WrappedComponent(props: T) {
    return (
      <>
        <StructuredData type="webpage" data={pageData} />
        <Component {...props} />
      </>
    );
  };
}

export default StructuredData;
