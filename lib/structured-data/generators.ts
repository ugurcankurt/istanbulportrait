/**
 * Schema generators for Istanbul Portrait
 * Generates type-safe JSON-LD structured data
 */

import type {
  LocalBusinessSchema,
  OrganizationSchema,
  PersonSchema,
  ServiceSchema,
  ReviewSchema,
  FAQPageSchema,
  BreadcrumbListSchema,
  SchemaConfig,
  ReviewData,
  FAQData,
  PackageData,
  BreadcrumbData,
  AggregateRatingSchema,
} from "./types";
import { SEO_CONFIG } from "@/lib/seo-config";

/**
 * Generate LocalBusiness schema for photography business
 */
export function generateLocalBusinessSchema(
  config: SchemaConfig,
): LocalBusinessSchema {
  const { baseUrl } = config;
  
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#localbusiness`,
    name: SEO_CONFIG.organization.name,
    description: SEO_CONFIG.site.description,
    url: baseUrl,
    telephone: SEO_CONFIG.organization.contactPoint.telephone,
    priceRange: SEO_CONFIG.business.priceRange,
    image: [
      SEO_CONFIG.person.image,
      SEO_CONFIG.organization.logo,
      `${baseUrl}/gallery/istanbul_photographer_1.jpg`,
    ],
    logo: SEO_CONFIG.organization.logo,
    address: {
      "@type": "PostalAddress",
      streetAddress: SEO_CONFIG.organization.address.streetAddress,
      addressLocality: SEO_CONFIG.organization.address.addressLocality,
      addressRegion: SEO_CONFIG.organization.address.addressRegion,
      postalCode: SEO_CONFIG.organization.address.postalCode,
      addressCountry: SEO_CONFIG.organization.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.0082,
      longitude: 28.9784,
    },
    areaServed: [
      {
        "@type": "City",
        name: "Istanbul",
        "@id": "https://en.wikipedia.org/wiki/Istanbul",
      },
      {
        "@type": "Country",
        name: "Turkey",
        "@id": "https://en.wikipedia.org/wiki/Turkey",
      },
    ],
    serviceArea: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: 41.0082,
        longitude: 28.9784,
      },
      geoRadius: "50000", // 50km radius
    },
    openingHours: SEO_CONFIG.business.openingHours,
    paymentAccepted: SEO_CONFIG.business.paymentAccepted,
    currenciesAccepted: SEO_CONFIG.business.currenciesAccepted,
    sameAs: SEO_CONFIG.organization.sameAs,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Photography Packages",
      itemListElement: SEO_CONFIG.services.offers.map((offer) => ({
        "@type": "Offer",
        name: offer.name,
        description: offer.description,
        price: offer.price,
        priceCurrency: offer.priceCurrency,
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString(),
        seller: {
          "@type": "Organization",
          name: SEO_CONFIG.organization.name,
        },
      })),
    },
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(
  config: SchemaConfig,
): OrganizationSchema {
  const { baseUrl } = config;
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: SEO_CONFIG.organization.name,
    url: baseUrl,
    logo: SEO_CONFIG.organization.logo,
    image: [
      SEO_CONFIG.organization.logo,
      SEO_CONFIG.person.image,
    ],
    description: SEO_CONFIG.site.description,
    sameAs: SEO_CONFIG.organization.sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SEO_CONFIG.organization.contactPoint.telephone,
      contactType: SEO_CONFIG.organization.contactPoint.contactType,
      areaServed: SEO_CONFIG.organization.contactPoint.areaServed,
      availableLanguage: SEO_CONFIG.organization.contactPoint.availableLanguage,
    },
    founder: {
      "@type": "Person",
      name: SEO_CONFIG.person.name,
      jobTitle: SEO_CONFIG.person.jobTitle,
      image: SEO_CONFIG.person.image,
      sameAs: SEO_CONFIG.person.sameAs,
    },
  };
}

/**
 * Generate Person schema for photographer
 */
export function generatePersonSchema(config: SchemaConfig): PersonSchema {
  const { baseUrl } = config;
  
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}/#person`,
    name: SEO_CONFIG.person.name,
    jobTitle: SEO_CONFIG.person.jobTitle,
    description: `Professional photographer specializing in portrait and lifestyle photography in Istanbul, Turkey.`,
    image: SEO_CONFIG.person.image,
    url: SEO_CONFIG.person.url,
    sameAs: SEO_CONFIG.person.sameAs,
    worksFor: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      "@id": `${baseUrl}/#organization`,
    },
    hasOccupation: {
      "@type": "Occupation",
      name: "Professional Photographer",
      occupationLocation: {
        "@type": "City",
        name: "Istanbul, Turkey",
      },
      skills: [
        "Portrait Photography",
        "Lifestyle Photography",
        "Couple Photography",
        "Tourism Photography",
        "Rooftop Photography",
      ],
    },
  };
}

/**
 * Generate Service schema for photography packages
 */
export function generateServiceSchema(
  packageData: PackageData,
  config: SchemaConfig,
): ServiceSchema {
  const { baseUrl } = config;
  
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${baseUrl}/packages#${packageData.id}`,
    name: packageData.name,
    description: packageData.description,
    provider: {
      "@type": "LocalBusiness",
      name: SEO_CONFIG.organization.name,
      "@id": `${baseUrl}/#localbusiness`,
    },
    areaServed: {
      "@type": "City",
      name: "Istanbul",
    },
    serviceType: "Photography Service",
    offers: {
      "@type": "Offer",
      name: packageData.name,
      description: packageData.description,
      price: packageData.price.toString(),
      priceCurrency: packageData.currency,
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString(),
      category: "Photography",
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "Duration",
          value: packageData.duration,
        },
        {
          "@type": "PropertyValue",
          name: "Locations",
          value: packageData.locations.toString(),
        },
        {
          "@type": "PropertyValue",
          name: "Edited Photos",
          value: packageData.photos.toString(),
        },
      ],
    },
  };
}

/**
 * Generate AggregateRating schema
 */
export function generateAggregateRatingSchema(
  reviews: ReviewData[],
): AggregateRatingSchema {
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  return {
    "@type": "AggregateRating",
    ratingValue: Number(averageRating.toFixed(1)),
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };
}

/**
 * Generate Review schema collection
 */
export function generateReviewsSchema(
  reviews: ReviewData[],
  config: SchemaConfig,
): ReviewSchema[] {
  const { baseUrl } = config;
  
  return reviews.map((review, index) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": `${baseUrl}/#review-${index}`,
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person",
      name: review.author,
    },
    reviewBody: review.reviewBody,
    datePublished: review.datePublished,
    itemReviewed: {
      "@type": "LocalBusiness",
      name: SEO_CONFIG.organization.name,
      "@id": `${baseUrl}/#localbusiness`,
    },
  }));
}

/**
 * Generate FAQ Page schema
 */
export function generateFAQPageSchema(
  faqs: FAQData[],
  config: SchemaConfig,
): FAQPageSchema {
  const { baseUrl } = config;
  
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${baseUrl}/#faqpage`,
    mainEntity: faqs.map((faq, index) => ({
      "@type": "Question",
      "@id": `${baseUrl}/#faq-${index}`,
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbListSchema(
  breadcrumbs: BreadcrumbData[],
  config: SchemaConfig,
): BreadcrumbListSchema {
  const { baseUrl } = config;
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${baseUrl}/#breadcrumb`,
    itemListElement: breadcrumbs.map((breadcrumb) => ({
      "@type": "ListItem",
      position: breadcrumb.position,
      name: breadcrumb.name,
      item: breadcrumb.url,
    })),
  };
}