"use client";

import { StructuredData } from "./structured-data";
import { SEO_CONFIG } from "@/lib/seo-config";

/**
 * Reviews Schema Component
 * Generates aggregate rating and individual review schemas for SEO
 */

export interface ReviewData {
  author: string;
  rating: number;
  review: string;
  date: string;
  title?: string;
  location?: string;
}

export interface ReviewsSchemaProps {
  reviews: ReviewData[];
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
    bestRating?: number;
    worstRating?: number;
  };
}

/**
 * Generate Aggregate Rating Schema
 */
function generateAggregateRatingSchema(
  reviews: ReviewData[],
  aggregateRating?: any,
) {
  const calculatedRating = aggregateRating || {
    ratingValue:
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };

  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: Math.round(calculatedRating.ratingValue * 10) / 10,
    reviewCount: calculatedRating.reviewCount,
    bestRating: calculatedRating.bestRating || 5,
    worstRating: calculatedRating.worstRating || 1,
    itemReviewed: {
      "@type": "Service",
      name: SEO_CONFIG.services.name,
      provider: {
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
        url: SEO_CONFIG.organization.url,
      },
    },
  };
}

/**
 * Generate Individual Review Schemas
 */
function generateReviewSchemas(reviews: ReviewData[]) {
  return reviews.map((review, index) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": `${SEO_CONFIG.site.url}/reviews#review-${index + 1}`,
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
    reviewBody: review.review,
    name: review.title || `${review.author}'s Review`,
    datePublished: review.date,
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
    },
    itemReviewed: {
      "@type": "Service",
      name: SEO_CONFIG.services.name,
      description: SEO_CONFIG.services.description,
      provider: {
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
        url: SEO_CONFIG.organization.url,
      },
      areaServed: SEO_CONFIG.services.areaServed,
    },
    ...(review.location && {
      locationCreated: {
        "@type": "Place",
        name: review.location,
      },
    }),
  }));
}

/**
 * Generate Business/Service with Reviews Schema
 */
function generateBusinessWithReviewsSchema(
  reviews: ReviewData[],
  aggregateRating?: any,
) {
  const calculatedRating = aggregateRating || {
    ratingValue:
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1,
  };

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": SEO_CONFIG.organization.url,
    name: SEO_CONFIG.organization.name,
    description: SEO_CONFIG.site.description,
    url: SEO_CONFIG.organization.url,
    image: SEO_CONFIG.organization.logo,
    telephone: SEO_CONFIG.organization.contactPoint.telephone,
    address: SEO_CONFIG.organization.address,
    geo: {
      "@type": "GeoCoordinates",
      latitude: "41.0082",
      longitude: "28.9784",
    },
    openingHours: SEO_CONFIG.business.openingHours,
    priceRange: SEO_CONFIG.business.priceRange,
    paymentAccepted: SEO_CONFIG.business.paymentAccepted,
    currenciesAccepted: SEO_CONFIG.business.currenciesAccepted,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Math.round(calculatedRating.ratingValue * 10) / 10,
      reviewCount: calculatedRating.reviewCount,
      bestRating: calculatedRating.bestRating || 5,
      worstRating: calculatedRating.worstRating || 1,
    },
    review: generateReviewSchemas(reviews),
    sameAs: SEO_CONFIG.organization.sameAs,
  };
}

/**
 * Main Reviews Schema Component
 */
export function ReviewsSchema({
  reviews,
  aggregateRating,
}: ReviewsSchemaProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Generate aggregate rating schema
  const aggregateSchema = generateAggregateRatingSchema(
    reviews,
    aggregateRating,
  );

  // Generate individual review schemas
  const reviewSchemas = generateReviewSchemas(reviews);

  // Generate business with reviews schema (comprehensive)
  const businessSchema = generateBusinessWithReviewsSchema(
    reviews,
    aggregateRating,
  );

  return (
    <>
      {/* Aggregate Rating Schema */}
      <StructuredData type="custom" data={aggregateSchema} />

      {/* Individual Review Schemas */}
      {reviewSchemas.map((reviewSchema, index) => (
        <StructuredData
          key={`review-${index}`}
          type="custom"
          data={reviewSchema}
        />
      ))}

      {/* Business with Reviews Schema (Main Entity) */}
      <StructuredData type="custom" data={businessSchema} />
    </>
  );
}

/**
 * Simple Review Schema Component for single reviews
 */
export function SingleReviewSchema({ review }: { review: ReviewData }) {
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
    },
    author: {
      "@type": "Person",
      name: review.author,
    },
    reviewBody: review.review,
    datePublished: review.date,
    itemReviewed: {
      "@type": "Service",
      name: SEO_CONFIG.services.name,
      provider: {
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
      },
    },
  };

  return <StructuredData type="custom" data={reviewSchema} />;
}

/**
 * Google Review Snippet Schema (for rich snippets)
 */
export function GoogleReviewSnippetSchema({
  reviews,
  aggregateRating,
}: ReviewsSchemaProps) {
  if (!reviews || reviews.length === 0) return null;

  const snippetSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SEO_CONFIG.organization.name,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue:
        aggregateRating?.ratingValue ||
        Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10,
        ) / 10,
      reviewCount: aggregateRating?.reviewCount || reviews.length,
      bestRating: 5,
    },
  };

  return <StructuredData type="custom" data={snippetSchema} />;
}

export default ReviewsSchema;
