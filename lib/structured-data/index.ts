/**
 * Structured Data exports for Istanbul Portrait
 */

// Components
export { JsonLd, MultipleJsonLd } from "./json-ld";

// Types
export type {
  LocalBusinessSchema,
  OrganizationSchema,
  PersonSchema,
  ServiceSchema,
  ProductSchema,
  ReviewSchema,
  FAQPageSchema,
  ImageSchema,
  BreadcrumbListSchema,
  ItemListSchema,
  ImageGallerySchema,
  HowToSchema,
  SchemaConfig,
  ReviewData,
  FAQData,
  PackageData,
  BreadcrumbData,
  ItemListData,
  ImageGalleryData,
  HowToStepData,
  AggregateRatingSchema,
} from "./types";

// Generators
export {
  generateLocalBusinessSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateServiceSchema,
  generateAggregateRatingSchema,
  generateReviewsSchema,
  generateFAQPageSchema,
  generateBreadcrumbListSchema,
  generateItemListSchema,
  generateImageGallerySchema,
  generateHowToSchema,
} from "./generators";

// Helper functions
export { createSchemaConfig } from "./utils";