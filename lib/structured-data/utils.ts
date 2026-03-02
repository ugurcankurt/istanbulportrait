/**
 * Utility functions for structured data generation
 */

import { SEO_CONFIG } from "@/lib/seo-config";
import type { SchemaConfig } from "./types";

/**
 * Create schema configuration with defaults
 */
export function createSchemaConfig(
  locale: string,
  overrides?: Partial<SchemaConfig>,
): SchemaConfig {
  return {
    locale,
    baseUrl: SEO_CONFIG.site.url,
    includeReviews: true,
    includeFAQ: true,
    ...overrides,
  };
}

/**
 * Sanitize text for JSON-LD to prevent XSS
 */
export function sanitizeForJsonLd(text: string): string {
  return text
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Format date for schema.org (ISO 8601)
 */
export function formatSchemaDate(date: Date): string {
  return date.toISOString();
}

/**
 * Generate unique ID for schema
 */
export function generateSchemaId(
  baseUrl: string,
  type: string,
  id?: string,
): string {
  const suffix = id ? `-${id}` : "";
  return `${baseUrl}/#${type.toLowerCase()}${suffix}`;
}

/**
 * Validate required schema properties
 */
export function validateRequiredProperties<T extends Record<string, any>>(
  data: T,
  required: Array<keyof T>,
): boolean {
  return required.every((key) => data[key] !== undefined && data[key] !== null);
}

/**
 * Convert price to schema.org format
 */
export function formatPrice(price: number): string {
  return price.toFixed(2);
}

/**
 * Generate opening hours in schema.org format
 */
export function formatOpeningHours(hours: string[]): string[] {
  return hours.map((hour) => {
    // Convert "Mo-Su 09:00-18:00" format to schema.org format
    return hour;
  });
}

/**
 * Create image object for schema
 */
export function createImageObject(
  url: string,
  width?: number,
  height?: number,
  description?: string,
) {
  return {
    "@type": "ImageObject" as const,
    url,
    ...(width && { width }),
    ...(height && { height }),
    ...(description && { description }),
  };
}

/**
 * Create postal address object
 */
export function createPostalAddress(
  streetAddress?: string,
  addressLocality?: string,
  addressRegion?: string,
  addressCountry?: string,
  postalCode?: string,
) {
  return {
    "@type": "PostalAddress" as const,
    ...(streetAddress && { streetAddress }),
    ...(addressLocality && { addressLocality }),
    ...(addressRegion && { addressRegion }),
    ...(addressCountry && { addressCountry }),
    ...(postalCode && { postalCode }),
  };
}

/**
 * Create contact point object
 */
export function createContactPoint(
  telephone: string,
  contactType: string = "customer service",
  availableLanguage?: string[],
  areaServed?: string,
) {
  return {
    "@type": "ContactPoint" as const,
    telephone,
    contactType,
    ...(availableLanguage && { availableLanguage }),
    ...(areaServed && { areaServed }),
  };
}

/**
 * Debug helper to log schema data in development
 */
export function debugSchema(schemaName: string, data: any): void {
  // Debug schema logging removed for production
}
