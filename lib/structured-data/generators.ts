/**
 * Schema generators for Istanbul Portrait
 * Generates type-safe JSON-LD structured data
 */

import { AI_SEARCH_CONFIG, SEO_CONFIG } from "@/lib/seo-config";
import type {
  AggregateRatingSchema,
  BreadcrumbData,
  BreadcrumbListSchema,
  FAQData,
  FAQPageSchema,
  HowToSchema,
  HowToStepData,
  ImageGalleryData,
  ImageGallerySchema,
  ItemListData,
  ItemListSchema,
  LocalBusinessSchema,
  OrganizationSchema,
  PackageData,
  PersonSchema,
  ReviewData,
  ReviewSchema,
  SchemaConfig,
  ServiceSchema,
  TourData,
  TourSchema,
} from "./types";

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
    // AI Search Enhancement
    knowsAbout: [
      "Istanbul Photography",
      "Portrait Photography",
      "Couple Photography",
      "Bosphorus Photography",
      "Galata Tower Photography",
      "Sultanahmet Photography",
      "Professional Photography Techniques",
      "Tourism Photography",
      "Wedding Photography",
    ],
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
    image: [SEO_CONFIG.organization.logo, SEO_CONFIG.person.image],
    description: SEO_CONFIG.site.description,
    foundingDate: SEO_CONFIG.organization.foundingDate,
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      value: parseInt(SEO_CONFIG.organization.numberOfEmployees),
    },
    award: SEO_CONFIG.organization.awards,
    sameAs: SEO_CONFIG.organization.sameAs,
    address: {
      "@type": "PostalAddress",
      streetAddress: SEO_CONFIG.organization.address.streetAddress,
      addressLocality: SEO_CONFIG.organization.address.addressLocality,
      addressRegion: SEO_CONFIG.organization.address.addressRegion,
      postalCode: SEO_CONFIG.organization.address.postalCode,
      addressCountry: SEO_CONFIG.organization.address.addressCountry,
    },
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
      "@id": `${baseUrl}/#localbusiness`,
      name: SEO_CONFIG.organization.name,
      url: baseUrl,
      telephone: SEO_CONFIG.organization.contactPoint.telephone,
      priceRange: SEO_CONFIG.business.priceRange,
      address: {
        "@type": "PostalAddress",
        streetAddress: SEO_CONFIG.organization.address.streetAddress,
        addressLocality: SEO_CONFIG.organization.address.addressLocality,
        addressRegion: SEO_CONFIG.organization.address.addressRegion,
        postalCode: SEO_CONFIG.organization.address.postalCode,
        addressCountry: SEO_CONFIG.organization.address.addressCountry,
      },
      image: [SEO_CONFIG.person.image, SEO_CONFIG.organization.logo],
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

/**
 * Generate ItemList schema for carousel rich results
 */
export function generateItemListSchema(
  items: ItemListData[],
  listName: string,
  config: SchemaConfig,
): ItemListSchema {
  const { baseUrl } = config;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${baseUrl}/#itemlist-${listName.toLowerCase().replace(/\s+/g, "-")}`,
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      description: item.description,
      url: item.url,
      image: item.image,
    })),
  };
}

/**
 * Generate ImageGallery schema for photo galleries
 */
export function generateImageGallerySchema(
  images: ImageGalleryData[],
  galleryName: string,
  config: SchemaConfig,
): ImageGallerySchema {
  const { baseUrl } = config;

  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "@id": `${baseUrl}/#gallery-${galleryName.toLowerCase().replace(/\s+/g, "-")}`,
    name: galleryName,
    description: `Professional photography gallery showcasing ${galleryName.toLowerCase()} in Istanbul`,
    image: images.map((img) => ({
      "@type": "ImageObject" as const,
      name: img.name,
      description: img.description,
      url: img.url,
      contentUrl: img.contentUrl,
      thumbnailUrl: img.thumbnailUrl,
      ...(img.width && { width: img.width.toString() }),
      ...(img.height && { height: img.height.toString() }),
      caption: img.caption,
      creditText: img.creditText || `Photography by ${SEO_CONFIG.person.name}`,
      license: img.license || `${baseUrl}/privacy#image-license`,
      copyrightNotice:
        img.copyrightNotice ||
        `© ${new Date().getFullYear()} ${SEO_CONFIG.organization.name}`,
      acquireLicensePage: img.acquireLicensePage || `${baseUrl}/contact`,
      creator: {
        "@type": "Person" as const,
        name: SEO_CONFIG.person.name,
      },
    })),
    creator: {
      "@type": "Person",
      name: SEO_CONFIG.person.name,
      jobTitle: SEO_CONFIG.person.jobTitle,
    },
  };
}

/**
 * Generate HowTo schema for photography process
 */
export function generateHowToSchema(
  steps: HowToStepData[],
  title: string,
  description: string,
  config: SchemaConfig,
): HowToSchema {
  const { baseUrl } = config;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${baseUrl}/#howto-${title.toLowerCase().replace(/\s+/g, "-")}`,
    name: title,
    description: description,
    image: steps.find((step) => step.image)?.image || SEO_CONFIG.person.image,
    totalTime: "PT30M", // 30 minutes estimated
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "EUR",
      value: "150",
    },
    supply: [
      {
        "@type": "HowToSupply",
        name: "Professional Camera",
      },
      {
        "@type": "HowToSupply",
        name: "Lighting Equipment",
      },
    ],
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: step.url,
      image: step.image,
    })),
    author: {
      "@type": "Person",
      name: SEO_CONFIG.person.name,
      jobTitle: SEO_CONFIG.person.jobTitle,
      image: SEO_CONFIG.person.image,
    },
  };
}

/**
 * Generate Tour schema for Viator tours
 */
export function generateTourSchema(
  tourData: TourData,
  config: SchemaConfig,
): TourSchema {
  const { baseUrl } = config;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${baseUrl}/tours#${tourData.id}`,
    name: tourData.name,
    description: tourData.description,
    image: tourData.images,
    category: tourData.category || "Tour",
    brand: {
      "@type": "Brand",
      name: tourData.provider || "Viator",
    },
    offers: {
      "@type": "Offer",
      name: tourData.name,
      description: tourData.description,
      price: tourData.price.toString(),
      priceCurrency: tourData.currency,
      availability:
        tourData.availability === "AVAILABLE"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      validFrom: new Date().toISOString(),
      url: tourData.bookingUrl,
      seller: {
        "@type": "Organization",
        name: tourData.provider || "Viator",
        url: "https://www.viator.com",
      },
      additionalProperty: [
        {
          "@type": "PropertyValue" as const,
          name: "Duration",
          value: tourData.duration,
        },
        {
          "@type": "PropertyValue" as const,
          name: "Location",
          value: tourData.location,
        },
        ...(tourData.cancellationPolicy
          ? [
            {
              "@type": "PropertyValue" as const,
              name: "Cancellation Policy",
              value: tourData.cancellationPolicy,
            },
          ]
          : []),
      ],
    },
    ...(tourData.rating && tourData.reviewCount
      ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: tourData.rating,
          reviewCount: tourData.reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }
      : {}),
    ...(tourData.highlights && tourData.highlights.length > 0
      ? {
        additionalProperty: tourData.highlights.map((highlight, index) => ({
          "@type": "PropertyValue" as const,
          name: `Highlight ${index + 1}`,
          value: highlight,
        })),
      }
      : {}),
  };
}

/**
 * Generate multiple Tour schemas for tour listings
 */
export function generateToursListSchema(
  tours: TourData[],
  config: SchemaConfig,
): TourSchema[] {
  return tours.map((tour) => generateTourSchema(tour, config));
}

/**
 * Generate ItemList schema for tours carousel/listing
 */
export function generateToursItemListSchema(
  tours: TourData[],
  config: SchemaConfig,
): ItemListSchema {
  const itemListData: ItemListData[] = tours.map((tour, index) => ({
    name: tour.name,
    description: `${tour.description} - Starting from ${tour.price} ${tour.currency}`,
    url: tour.bookingUrl,
    image: tour.images[0],
    position: index + 1,
  }));

  return generateItemListSchema(
    itemListData,
    "Istanbul Tours and Activities",
    config,
  );
}

/**
 * Generate Enhanced LocalBusiness schema with AI Search optimization
 */
export function generateEnhancedLocalBusinessSchema(
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
    // AI Search Enhancement
    knowsAbout: [
      "Istanbul Photography",
      "Portrait Photography",
      "Couple Photography",
      "Bosphorus Photography",
      "Galata Tower Photography",
      "Sultanahmet Photography",
      "Professional Photography Techniques",
      "Tourism Photography",
      "Wedding Photography",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Istanbul Photography Services",
      itemListElement: SEO_CONFIG.services.offers.map((offer) => ({
        "@type": "Offer",
        name: offer.name,
        description: `${offer.description}. Professional photographer Uğur Cankurt with 8+ years experience. Includes consultation, editing, and digital delivery.`,
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
    // AggregateRating for Google Rich Results (star ratings)
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "50",
      bestRating: "5",
      worstRating: "1",
    },
  };
}
