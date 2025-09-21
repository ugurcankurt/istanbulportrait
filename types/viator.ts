// Viator API TypeScript definitions for Affiliate Basic Access

export interface ViatorDestination {
  destinationId: number;
  destinationName: string;
  country: string;
  state?: string;
  worldRegion: string;
  sortOrder: number;
  selectable: boolean;
  destinationType: string;
  parentId?: number;
  timeZone: string;
}

export interface ViatorAttraction {
  attractionId: number;
  attractionName: string;
  destinationId: number;
  destinationName: string;
  latitude: number;
  longitude: number;
  primaryGroupId: string;
  photoURL?: string;
  thumbnailURL?: string;
  attractionStreetAddress?: string;
  attractionCity?: string;
  attractionState?: string;
  attractionCountry?: string;
  attractionDescription?: string;
}

export interface ViatorPhoto {
  photoURL: string;
  thumbnailURL: string;
  caption?: string;
}

export interface ViatorReview {
  rating: number;
  title: string;
  text: string;
  userName: string;
  reviewDate: string;
  helpful: number;
  totalHelpful: number;
}

export interface ViatorPricingSummary {
  fromPrice: number;
  fromPriceBeforeDiscount?: number;
}

export interface ViatorPricing {
  summary: ViatorPricingSummary;
  currency: string;
  extraChargesSummary?: {
    fromPrice: number;
    extraCharges: number;
  };
}

export interface ViatorImageVariant {
  height: number;
  width: number;
  url: string;
}

export interface ViatorImage {
  imageSource: string;
  caption: string;
  isCover: boolean;
  variants: ViatorImageVariant[];
}

export interface ViatorReviewSource {
  provider: string;
  totalCount: number;
  averageRating: number;
}

export interface ViatorReviews {
  sources: ViatorReviewSource[];
  totalReviews: number;
  combinedAverageRating: number;
}

export interface ViatorDuration {
  fixedDurationInMinutes?: number;
  variableDurationFromMinutes?: number;
  variableDurationToMinutes?: number;
}

export interface ViatorDestinationRef {
  ref: string;
  primary: boolean;
}

export interface ViatorTranslationInfo {
  containsMachineTranslatedText: boolean;
  translationSource: string;
}

export interface ViatorProduct {
  productCode: string;
  title: string;
  description: string;
  images: ViatorImage[];
  reviews: ViatorReviews;
  duration: ViatorDuration;
  confirmationType: string;
  itineraryType: string;
  pricing: ViatorPricing;
  productUrl: string;
  destinations: ViatorDestinationRef[];
  tags: number[];
  flags: string[];
  translationInfo: ViatorTranslationInfo;
}

export interface ViatorItineraryItem {
  dayNumber: number;
  description: string;
  title?: string;
  duration?: string;
}

export interface ViatorHoursOfOperation {
  dayOfWeek: string;
  openTime?: string;
  closeTime?: string;
  allDay?: boolean;
  closed?: boolean;
}

export interface ViatorLanguageGuide {
  languageCode: string;
  description: string;
}

export interface ViatorSearchResponse {
  errorReference?: string;
  products?: ViatorProduct[];
  data?: ViatorProduct[];
  vmid?: string;
  errorMessage?: string;
  success: boolean;
  totalCount?: number;
  errorName?: string;
}

// New Viator API v2.0 format with filtering
export interface ViatorSearchRequest {
  filtering?: {
    destination?: number;
    categoryId?: number;
    subcategoryId?: number;
    startDate?: string;
    endDate?: string;
  };
  topX?: number;
  start?: number; // Pagination support (Viator API uses 'start' parameter)
  sortOrder?:
    | "REVIEW_AVG_RATING_D"
    | "PRICE"
    | "PRICE_FROM_A"
    | "REVIEW_AVG_RATING_A";
  currency?: "USD" | "EUR" | "GBP" | "AUD" | "CAD";
  locale?: string;
  // Legacy fields for backward compatibility (will be moved to filtering)
  categoryId?: number;
  subcategoryId?: number;
  startDate?: string;
  endDate?: string;
}

// Legacy interface - deprecated, use ViatorSearchRequest instead
export interface ViatorDestinationSearchRequest {
  destId: number;
  startDate?: string;
  endDate?: string;
  topX?: number;
  sortOrder?:
    | "REVIEW_AVG_RATING_D"
    | "PRICE"
    | "PRICE_FROM_A"
    | "REVIEW_AVG_RATING_A";
  categoryId?: number;
  subcategoryId?: number;
  currencyCode?: "USD" | "EUR" | "GBP" | "AUD" | "CAD";
  currency?: "USD" | "EUR" | "GBP" | "AUD" | "CAD";
  locale?: string;
}

// Istanbul destination ID (from Viator API)
export const ISTANBUL_DESTINATION_ID = 585;

// Popular tour categories in Istanbul
export const ISTANBUL_TOUR_CATEGORIES = {
  HISTORICAL: 1,
  CULTURAL: 2,
  FOOD_WINE: 3,
  CRUISES: 4,
  PHOTOGRAPHY: 5,
  WALKING_TOURS: 6,
  PRIVATE_TOURS: 7,
} as const;

// API Response wrapper with improved error handling
export interface ViatorAPIResponse<T> {
  success: boolean;
  data?: T | undefined;
  errorMessage?: string;
  errorReference?: string;
  vmid?: string;
}

// Helper type for success responses
export interface ViatorSuccessResponse<T> extends ViatorAPIResponse<T> {
  success: true;
  data: T;
}

// Helper type for error responses
export interface ViatorErrorResponse extends ViatorAPIResponse<undefined> {
  success: false;
  data: undefined;
  errorMessage: string;
}
