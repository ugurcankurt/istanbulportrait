/**
 * Viator API to Schema.org data mapping utilities
 * Converts Viator API responses to structured data format
 */

import type { TourData } from "@/lib/structured-data/types";
import type { ViatorProduct } from "@/types/viator";

/**
 * Convert Viator product to TourData for schema generation
 */
export function mapViatorToTourData(
  product: ViatorProduct,
  locale: string = "en",
): TourData {
  // Extract price information
  const pricing = product.pricing?.summary;
  const price = pricing?.fromPrice || pricing?.fromPriceBeforeDiscount || 0;
  const currency = product.pricing?.currency || "EUR";

  // Extract duration information
  const durationMinutes =
    product.duration?.fixedDurationInMinutes ||
    product.duration?.variableDurationFromMinutes ||
    180;
  const duration = `${Math.ceil(durationMinutes / 60)} hours`;

  // Extract location information
  const location = product.destinations?.[0]?.ref || "Istanbul, Turkey";

  // Extract images
  const images =
    product.images
      ?.map(
        (img) =>
          img.variants?.find((v) => v.width >= 400)?.url ||
          img.variants?.[0]?.url,
      )
      .filter((url): url is string => Boolean(url)) || [];

  // Extract rating information
  const rating = product.reviews?.combinedAverageRating || 0;
  const reviewCount = product.reviews?.totalReviews || 0;

  // Extract highlights and inclusions (inclusions not available in basic API)
  const highlights: string[] = [];
  const includes: string[] = [];

  // Generate booking URL with affiliate parameters
  const viatorClient = require("@/lib/viator");
  const bookingUrl = viatorClient.buildBookingUrl
    ? viatorClient.buildBookingUrl(product, locale)
    : `https://www.viator.com/tours/${product.productCode}`;

  // Extract cancellation policy (not available in basic API)
  const cancellationPolicy = "Please check booking terms";

  // Extract category from tags (tags are numbers in basic API)
  const category = "Tour & Activity"; // Category details not available in basic API

  return {
    id: product.productCode,
    name: product.title,
    description: product.description,
    price: price,
    currency: currency,
    duration: duration,
    location: location,
    rating: rating,
    reviewCount: reviewCount,
    images: images,
    provider: "Viator",
    availability:
      product.confirmationType === "INSTANT" ? "AVAILABLE" : "LIMITED",
    bookingUrl: bookingUrl,
    category: category,
    highlights: highlights,
    includes: includes,
    cancellationPolicy: cancellationPolicy,
  };
}

/**
 * Convert multiple Viator products to TourData array
 */
export function mapViatorProductsToTourData(
  products: ViatorProduct[],
  locale: string = "en",
): TourData[] {
  return products.map((product) => mapViatorToTourData(product, locale));
}

/**
 * Extract SEO-friendly data from Viator product for meta tags
 */
export function extractViatorSEOData(product: ViatorProduct) {
  const pricing = product.pricing?.summary;
  const price = pricing?.fromPrice || pricing?.fromPriceBeforeDiscount;
  const currency = product.pricing?.currency || "EUR";

  return {
    title: product.title,
    description: product.description,
    price: price ? `from ${price} ${currency}` : undefined,
    rating: product.reviews?.combinedAverageRating,
    reviewCount: product.reviews?.totalReviews,
    duration: product.duration?.fixedDurationInMinutes
      ? `${Math.ceil(product.duration.fixedDurationInMinutes / 60)} hours`
      : undefined,
    location: product.destinations?.[0]?.ref,
    images: product.images
      ?.map(
        (img) =>
          img.variants?.find((v) => v.width >= 800)?.url ||
          img.variants?.[0]?.url,
      )
      .filter((url): url is string => Boolean(url)),
    cancellation: undefined, // Cancellation info not available in basic API
  };
}

/**
 * Generate breadcrumb data for tour pages
 */
export function generateTourBreadcrumbs(
  product: ViatorProduct,
  baseUrl: string,
  locale: string = "en",
) {
  const location = product.destinations?.[0]?.ref || "Istanbul";

  return [
    { name: "Home", url: `${baseUrl}/${locale}`, position: 1 },
    { name: "Tours", url: `${baseUrl}/${locale}/tours`, position: 2 },
    {
      name: location,
      url: `${baseUrl}/${locale}/tours?location=${encodeURIComponent(location)}`,
      position: 3,
    },
    {
      name: product.title,
      url: `${baseUrl}/${locale}/tours/${product.productCode}`,
      position: 4,
    },
  ];
}
