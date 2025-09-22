/**
 * Structured Data exports for Istanbul Portrait
 */

// Generators
export {
  generateAggregateRatingSchema,
  generateBreadcrumbListSchema,
  generateEnhancedLocalBusinessSchema,
  generateFAQPageSchema,
  generateHowToSchema,
  generateImageGallerySchema,
  generateItemListSchema,
  generateLocalBusinessSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateReviewsSchema,
  generateServiceSchema,
  generateTourSchema,
  generateToursItemListSchema,
  generateToursListSchema,
} from "./generators";
// Components
export { JsonLd, MultipleJsonLd } from "./json-ld";
// Types
export type {
  AggregateRatingSchema,
  BreadcrumbData,
  BreadcrumbListSchema,
  FAQData,
  FAQPageSchema,
  HowToSchema,
  HowToStepData,
  ImageGalleryData,
  ImageGallerySchema,
  ImageSchema,
  ItemListData,
  ItemListSchema,
  LocalBusinessSchema,
  OrganizationSchema,
  PackageData,
  PersonSchema,
  ProductSchema,
  ReviewData,
  ReviewSchema,
  SchemaConfig,
  ServiceSchema,
  TourData,
  TourSchema,
} from "./types";

// Helper functions
export { createSchemaConfig } from "./utils";
