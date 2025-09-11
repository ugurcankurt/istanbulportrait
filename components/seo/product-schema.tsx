"use client";

import { StructuredData } from "./structured-data";
import { SEO_CONFIG } from "@/lib/seo-config";

/**
 * Product/Service Schema Components for Photography Packages
 * Generates rich product schemas for better e-commerce SEO
 */

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: string;
  currency?: string;
  image?: string;
  category?: string;
  brand?: string;
  sku?: string;
  availability?: string;
  condition?: string;
  url?: string;
  offers?: OfferData[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
  };
  features?: string[];
  duration?: string;
  photos?: string;
  locations?: string;
}

export interface OfferData {
  price: string;
  priceCurrency: string;
  availability: string;
  validFrom?: string;
  validThrough?: string;
  url?: string;
  seller?: string;
}

export interface ProductSchemaProps {
  product: ProductData;
  type?: "Product" | "Service" | "Offer";
}

/**
 * Generate Product Schema
 */
function generateProductSchema(product: ProductData): any {
  const baseUrl = SEO_CONFIG.site.url;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${baseUrl}/packages#${product.id}`,
    name: product.name,
    description: product.description,
    image: product.image || SEO_CONFIG.images.ogImage,
    brand: {
      "@type": "Brand",
      name: product.brand || SEO_CONFIG.organization.name,
    },
    manufacturer: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      url: SEO_CONFIG.organization.url,
    },
    category: product.category || "Photography Services",
    sku: product.sku || product.id,
    gtin: product.id,
    url: product.url
      ? `${baseUrl}${product.url}`
      : `${baseUrl}/packages#${product.id}`,
    offers: {
      "@type": "Offer",
      price: product.price.replace(/[€$]/g, ""),
      priceCurrency: product.currency || "EUR",
      availability: product.availability || "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      url: product.url
        ? `${baseUrl}${product.url}`
        : `${baseUrl}/packages#${product.id}`,
      seller: {
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
        url: SEO_CONFIG.organization.url,
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        returnWithin: "P30D",
      },
    },
    ...(product.aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.aggregateRating.ratingValue,
        reviewCount: product.aggregateRating.reviewCount,
        bestRating: product.aggregateRating.bestRating || 5,
      },
    }),
    additionalProperty: [
      ...(product.duration
        ? [
            {
              "@type": "PropertyValue",
              name: "Duration",
              value: product.duration,
            },
          ]
        : []),
      ...(product.photos
        ? [
            {
              "@type": "PropertyValue",
              name: "Photos Included",
              value: product.photos,
            },
          ]
        : []),
      ...(product.locations
        ? [
            {
              "@type": "PropertyValue",
              name: "Locations",
              value: product.locations,
            },
          ]
        : []),
      ...(product.features?.map((feature) => ({
        "@type": "PropertyValue",
        name: "Feature",
        value: feature,
      })) || []),
    ],
  };
}

/**
 * Generate Service Schema
 */
function generateServiceSchema(product: ProductData): any {
  const baseUrl = SEO_CONFIG.site.url;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${baseUrl}/services#${product.id}`,
    name: product.name,
    description: product.description,
    image: product.image || SEO_CONFIG.images.ogImage,
    provider: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      url: SEO_CONFIG.organization.url,
      logo: SEO_CONFIG.organization.logo,
    },
    serviceType: product.category || "Photography Service",
    areaServed: {
      "@type": "City",
      name: "Istanbul",
      containedInPlace: {
        "@type": "Country",
        name: "Turkey",
      },
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${product.name} Options`,
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: product.name,
          },
          price: product.price.replace(/[€$]/g, ""),
          priceCurrency: product.currency || "EUR",
          availability: "https://schema.org/InStock",
        },
      ],
    },
    offers: {
      "@type": "Offer",
      price: product.price.replace(/[€$]/g, ""),
      priceCurrency: product.currency || "EUR",
      availability: product.availability || "https://schema.org/InStock",
      validFrom: new Date().toISOString().split("T")[0],
      url: product.url
        ? `${baseUrl}${product.url}`
        : `${baseUrl}/packages#${product.id}`,
      seller: {
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
      },
    },
    ...(product.aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.aggregateRating.ratingValue,
        reviewCount: product.aggregateRating.reviewCount,
        bestRating: product.aggregateRating.bestRating || 5,
      },
    }),
    termsOfService: `${baseUrl}/privacy`,
    serviceOutput: {
      "@type": "CreativeWork",
      name: "Professional Photography",
      description: "High-quality edited digital photographs",
    },
  };
}

/**
 * Generate Offer Schema
 */
function generateOfferSchema(product: ProductData): any {
  const baseUrl = SEO_CONFIG.site.url;

  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "@id": `${baseUrl}/offers#${product.id}`,
    name: product.name,
    description: product.description,
    price: product.price.replace(/[€$]/g, ""),
    priceCurrency: product.currency || "EUR",
    availability: product.availability || "https://schema.org/InStock",
    validFrom: new Date().toISOString().split("T")[0],
    validThrough: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    url: product.url
      ? `${baseUrl}${product.url}`
      : `${baseUrl}/packages#${product.id}`,
    seller: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      url: SEO_CONFIG.organization.url,
    },
    itemOffered: {
      "@type": "Service",
      name: product.name,
      description: product.description,
      category: product.category || "Photography Services",
    },
    priceSpecification: {
      "@type": "PriceSpecification",
      price: product.price.replace(/[€$]/g, ""),
      priceCurrency: product.currency || "EUR",
      valueAddedTaxIncluded: true,
    },
    eligibleRegion: {
      "@type": "Country",
      name: "Turkey",
    },
    businessFunction: "https://purl.org/goodrelations/v1#Sell",
  };
}

/**
 * Main Product Schema Component
 */
export function ProductSchema({
  product,
  type = "Service",
}: ProductSchemaProps) {
  let schemaData: any;

  switch (type) {
    case "Product":
      schemaData = generateProductSchema(product);
      break;
    case "Service":
      schemaData = generateServiceSchema(product);
      break;
    case "Offer":
      schemaData = generateOfferSchema(product);
      break;
    default:
      schemaData = generateServiceSchema(product);
  }

  return <StructuredData type="custom" data={schemaData} />;
}

/**
 * Photography Package Schema (specialized for photo services)
 */
export function PhotographyPackageSchema({
  product,
}: {
  product: ProductData;
}) {
  const packageSchema = {
    "@context": "https://schema.org",
    "@type": ["Service", "CreativeWork"],
    "@id": `${SEO_CONFIG.site.url}/packages#${product.id}`,
    name: product.name,
    description: product.description,
    creator: {
      "@type": "Person",
      name: SEO_CONFIG.person.name,
      jobTitle: "Professional Photographer",
    },
    provider: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      url: SEO_CONFIG.organization.url,
    },
    serviceType: "Photography Service",
    category: "Portrait Photography",
    offers: {
      "@type": "Offer",
      name: `${product.name} Photography Package`,
      price: product.price.replace(/[€$]/g, ""),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
      },
      itemOffered: {
        "@type": "Service",
        name: product.name,
        serviceType: "Professional Photography Session",
      },
    },
    additionalType: "https://schema.org/PhotographAction",
    workExample: {
      "@type": "CreativeWork",
      name: "Photography Portfolio",
      url: `${SEO_CONFIG.site.url}/gallery`,
    },
    areaServed: {
      "@type": "City",
      name: "Istanbul",
    },
  };

  return <StructuredData type="custom" data={packageSchema} />;
}

/**
 * Multiple Products Schema (for package listing pages)
 */
export function MultipleProductsSchema({
  products,
}: {
  products: ProductData[];
}) {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Photography Packages",
    description: "Professional photography packages available in Istanbul",
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.name,
      url: `${SEO_CONFIG.site.url}/packages#${product.id}`,
      item: {
        "@type": "Service",
        name: product.name,
        description: product.description,
        offers: {
          "@type": "Offer",
          price: product.price.replace(/[€$]/g, ""),
          priceCurrency: "EUR",
        },
      },
    })),
  };

  return <StructuredData type="custom" data={collectionSchema} />;
}

export default ProductSchema;
