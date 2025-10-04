/**
 * Type definitions for Istanbul Portrait structured data
 */

import type {
  AggregateRating,
  BreadcrumbList,
  ContactPoint,
  FAQPage,
  HowTo,
  ImageGallery,
  ImageObject,
  ItemList,
  LocalBusiness,
  Offer,
  OpeningHoursSpecification,
  Organization,
  Person,
  PostalAddress,
  Product,
  Review,
  Service,
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

// Tours and travel schemas
export type TourSchema = WithContext<Product>;
export type TourOfferSchema = Offer;
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

// Tour data interface for Viator tours
export interface TourData {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  location: string;
  rating: number;
  reviewCount: number;
  images: string[];
  provider: string;
  availability: string;
  bookingUrl: string;
  category?: string;
  highlights?: string[];
  includes?: string[];
  cancellationPolicy?: string;
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
  creditText?: string;
  license?: string;
  copyrightNotice?: string;
  acquireLicensePage?: string;
}

// HowTo step data interface
export interface HowToStepData {
  name: string;
  text: string;
  url?: string;
  image?: string;
}
