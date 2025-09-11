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
  SchemaConfig,
  ReviewData,
  FAQData,
  PackageData,
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
} from "./generators";

// Helper functions
export { createSchemaConfig } from "./utils";