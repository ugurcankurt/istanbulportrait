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
  generatePlaceListSchema,
} from "./generators";
// AI-Optimized Schema Generators
export {
  generateAIAnswersSchema,
  generateAILocalBusinessSchema,
  generateAIOptimizedArticleSchema,
  generateAIOptimizedFAQSchema,
  generateSpeakableSchema,
  generateWebSiteSchema,
} from "./ai-schemas";
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
  PlaceListData,
  PlaceSchema,
} from "./types";

// Helper functions
export { createSchemaConfig } from "./utils";
