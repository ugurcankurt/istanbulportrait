/**
 * Type definitions for Istanbul Portrait structured data
 */

import type {
  LocalBusiness,
  Organization,
  Person,
  Service,
  Review,
  AggregateRating,
  FAQPage,
  ImageObject,
  PostalAddress,
  ContactPoint,
  OpeningHoursSpecification,
  Offer,
  Product,
  BreadcrumbList,
  ListItem,
  ItemList,
  ImageGallery,
  HowTo,
  WithContext,
} from "schema-dts";

// Core business schemas
export type LocalBusinessSchema = WithContext<LocalBusiness>;
export type OrganizationSchema = WithContext<Organization>;
export type PersonSchema = WithContext<Person>;

// Service and product schemas
export type ServiceSchema = WithContext<Service>;
export type ProductSchema = WithContext<Product>;
export type OfferSchema = Offer;

// Review schemas
export type ReviewSchema = WithContext<Review>;
export type AggregateRatingSchema = AggregateRating;

// Content schemas
export type FAQPageSchema = WithContext<FAQPage>;
export type ImageSchema = WithContext<ImageObject>;
export type BreadcrumbListSchema = WithContext<BreadcrumbList>;
export type ItemListSchema = WithContext<ItemList>;
export type ImageGallerySchema = WithContext<ImageGallery>;
export type HowToSchema = WithContext<HowTo>;

// Helper schemas
export type PostalAddressSchema = PostalAddress;
export type ContactPointSchema = ContactPoint;
export type OpeningHoursSchema = OpeningHoursSpecification;

// Union type for all supported schemas
export type SupportedSchema =
  | LocalBusinessSchema
  | OrganizationSchema
  | PersonSchema
  | ServiceSchema
  | ProductSchema
  | ReviewSchema
  | FAQPageSchema
  | ImageSchema
  | BreadcrumbListSchema
  | ItemListSchema
  | ImageGallerySchema
  | HowToSchema;

// Configuration interface for schema generation
export interface SchemaConfig {
  locale: string;
  baseUrl: string;
  includeReviews?: boolean;
  includeFAQ?: boolean;
}

// Review data interface
export interface ReviewData {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished: string;
}

// FAQ data interface
export interface FAQData {
  question: string;
  answer: string;
}

// Package/Service data interface
export interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  included: string[];
  locations: number;
  photos: number;
}

// Breadcrumb data interface
export interface BreadcrumbData {
  name: string;
  url: string;
  position: number;
}

// ItemList data interface
export interface ItemListData {
  name: string;
  description?: string;
  url: string;
  image?: string;
  position: number;
}

// ImageGallery data interface  
export interface ImageGalleryData {
  name: string;
  description?: string;
  url: string;
  contentUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  caption?: string;
}

// HowTo step data interface
export interface HowToStepData {
  name: string;
  text: string;
  url?: string;
  image?: string;
}