/**
 * GetYourGuide integration utilities
 * Widget-based tour integration for Istanbul photography business
 */

import type {
  GetYourGuideWidgetConfig,
  TourCategory,
} from "@/types/getyourguide";
import {
  buildBookingUrl,
  GETYOURGUIDE_CONFIG,
  GETYOURGUIDE_LOCALE_MAP,
  ISTANBUL_TOURS,
  TOUR_CATEGORIES,
} from "@/types/getyourguide";

// Re-export commonly used types and constants
export type { TourCategory };
export { ISTANBUL_TOURS, TOUR_CATEGORIES, GETYOURGUIDE_CONFIG };

/**
 * Get popular Istanbul tours for the homepage
 * Priority given to Bosphorus tours as requested
 */
export function getPopularIstanbulTours(limit: number = 6): string[] {
  const popularTours = [
    // Priority Bosphorus Tours (shown first as requested)
    ISTANBUL_TOURS.BOSPHORUS_SIGHTSEEING_CRUISE,
    ISTANBUL_TOURS.BOSPHORUS_SUNSET_YACHT,
    ISTANBUL_TOURS.BOSPHORUS_DINNER_CRUISE,
    ISTANBUL_TOURS.BOSPHORUS_SUNSET_DRINKS,
    ISTANBUL_TOURS.BOSPHORUS_3H_DAY_CRUISE,
    ISTANBUL_TOURS.BOSPHORUS_TURKISH_NIGHT,
    ISTANBUL_TOURS.ISTANBUL_YACHT_TOUR,
    ISTANBUL_TOURS.BOSPHORUS_SUNSET_BOAT,

    // Other Popular Tours
    ISTANBUL_TOURS.HAGIA_SOPHIA_SKIP_LINE,
    ISTANBUL_TOURS.DOLMABAHCE_PALACE,
    ISTANBUL_TOURS.WHIRLING_DERVISHES,
    ISTANBUL_TOURS.MOSAIC_WORKSHOP,
    ISTANBUL_TOURS.TURKISH_BATH_SPA,
    ISTANBUL_TOURS.CAPPADOCIA_2_DAYS,
    ISTANBUL_TOURS.ERTUGRUL_FILM_SET,
    ISTANBUL_TOURS.TURKISH_COFFEE_WORKSHOP,
  ];

  return popularTours.slice(0, limit);
}

/**
 * Get tours by category
 */
export function getToursByCategory(
  category: TourCategory,
  limit?: number,
): string[] {
  const tours = TOUR_CATEGORIES[category] || [];
  return limit ? tours.slice(0, limit) : tours;
}

// Note: Static tour data functions removed - using widgets only

/**
 * Build GetYourGuide booking URL with affiliate parameters
 */
export function buildGetYourGuideBookingUrl(
  tourId: string,
  locale: string = "en",
): string {
  return buildBookingUrl(tourId, locale);
}

/**
 * Get widget configuration for a tour
 * Note: Arabic locale falls back to English as GetYourGuide doesn't support Arabic
 */
export function getWidgetConfig(
  tourId: string,
  locale: string = "en",
  variant: "vertical" | "horizontal" | "compact" = "vertical",
): GetYourGuideWidgetConfig {
  // Use English fallback for Arabic since GetYourGuide doesn't support Arabic
  const gygLocale =
    locale === "ar" ? "en-US" : GETYOURGUIDE_LOCALE_MAP[locale] || "en-US";

  return {
    tourId,
    locale: gygLocale,
    currency: "EUR",
    variant,
    partnerId: GETYOURGUIDE_CONFIG.PARTNER_ID,
    campaign: GETYOURGUIDE_CONFIG.CAMPAIGN,
  };
}

/**
 * Get tours for photography package cross-sell
 */
export function getCrossSellTours(
  packageType: "essential" | "premium" | "luxury",
  limit: number = 3,
): string[] {
  const crossSellMap = {
    essential: getToursByCategory("historical", limit),
    premium: getToursByCategory("photography", limit),
    luxury: getToursByCategory("private", limit),
  };

  return crossSellMap[packageType] || getToursByCategory("cultural", limit);
}

/**
 * Get featured tours for specific sections
 */
export function getFeaturedTours(): {
  historical: string[];
  photography: string[];
  cruises: string[];
} {
  return {
    historical: [],
    photography: [],
    cruises: [],
  };
}

/**
 * Initialize GetYourGuide widgets on page
 * This should be called after widget DOM elements are added
 */
export function initializeGetYourGuideWidgets(): void {
  if (typeof window !== "undefined" && window.gyg) {
    try {
      window.gyg.init();
    } catch (error) {
      console.warn("GetYourGuide widget initialization failed:", error);
    }
  }
}

/**
 * Track GetYourGuide widget interaction for analytics
 */
export function trackWidgetInteraction(
  action: string,
  tourId: string,
  locale: string,
  additionalData?: Record<string, unknown>,
): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "getyourguide_widget_interaction", {
      event_category: "GetYourGuide",
      event_label: tourId,
      action: action,
      locale: locale,
      ...additionalData,
    });
  }
}

/**
 * Track tour booking click for analytics
 */
export function trackTourBookingClick(
  tourId: string,
  tourName: string,
  price: number,
  locale: string,
): void {
  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "tour_booking_click", {
      event_category: "Tours",
      event_label: tourName,
      tour_id: tourId,
      tour_price: price,
      currency: "EUR",
      locale: locale,
    });
  }

  // Facebook Pixel
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_ids: [tourId],
      content_type: "product",
      content_name: tourName,
      value: price,
      currency: "EUR",
    });
  }
}

/**
 * Validate tour ID format
 */
export function isValidTourId(tourId: string): boolean {
  return /^\d+$/.test(tourId) && tourId.length >= 5;
}

/**
 * Get all available tour IDs
 */
export function getAllTourIds(): string[] {
  return Object.values(ISTANBUL_TOURS);
}

// Tour metadata for filtering and search
export const TOUR_METADATA: Record<
  string,
  {
    name: string;
    category: TourCategory;
    keywords: string[];
  }
> = {
  // Priority Bosphorus Tours
  "653610": {
    name: "Daytime/Sunset Sightseeing Cruise",
    category: "cruises",
    keywords: ["boğaz", "sunset", "sightseeing", "cruise", "audio"],
  },
  "854046": {
    name: "Bosphorus 3-Hour Day Cruise",
    category: "cruises",
    keywords: ["boğaz", "3-hour", "asian", "side", "day"],
  },
  "418223": {
    name: "Sunset Boat Cruise",
    category: "cruises",
    keywords: ["boğaz", "sunset", "boat", "evening"],
  },
  "461969": {
    name: "Bosphorus Audio Cruise",
    category: "cruises",
    keywords: ["boğaz", "audio", "guide", "sightseeing"],
  },
  "764101": {
    name: "Sunset Cruise with Drinks",
    category: "cruises",
    keywords: ["boğaz", "sunset", "drinks", "snacks"],
  },
  "648978": {
    name: "Sunset Bosphorus Yacht",
    category: "cruises",
    keywords: ["boğaz", "yacht", "sunset", "luxury"],
  },
  "426934": {
    name: "Sunset Cruise with Canapés",
    category: "cruises",
    keywords: ["boğaz", "sunset", "canapés", "drinks"],
  },
  "438511": {
    name: "Dinner Cruise with Turkish Show",
    category: "cruises",
    keywords: ["boğaz", "dinner", "turkish", "show", "night"],
  },
  "415437": {
    name: "Bosphorus Dinner Cruise",
    category: "cruises",
    keywords: ["boğaz", "yemek", "cruise", "dinner", "private"],
  },
  "419108": {
    name: "Dinner Cruise Turkish Night Show",
    category: "cruises",
    keywords: ["boğaz", "dinner", "turkish", "night", "show"],
  },
  "449332": {
    name: "Istanbul Yacht Tour",
    category: "cruises",
    keywords: ["yacht", "tour", "boğaz", "luxury"],
  },

  // Historical & Cultural Tours
  "558094": {
    name: "Dolmabahce Palace Fast Track",
    category: "historical",
    keywords: ["dolmabahçe", "palace", "fast", "track", "audio"],
  },
  "975641": {
    name: "Mosaic Workshop",
    category: "cultural",
    keywords: ["mozaik", "workshop", "art", "sanat"],
  },
  "593344": {
    name: "Turkish Bath & Spa",
    category: "private",
    keywords: ["hamam", "spa", "massage", "masaj"],
  },
  "21283": {
    name: "Whirling Dervishes Show",
    category: "cultural",
    keywords: ["semazen", "sufi", "dance", "dans"],
  },
  "597339": {
    name: "Hagia Sophia Skip-Line",
    category: "historical",
    keywords: ["ayasofya", "museum", "byzantine"],
  },
  "467821": {
    name: "Turkish Bath & Sauna",
    category: "private",
    keywords: ["hamam", "sauna", "relax"],
  },
  "396081": {
    name: "2-Day Cappadocia Trip",
    category: "adventure",
    keywords: ["kapadokya", "balloon", "cave"],
  },
  "543562": {
    name: "Ertugrul Film Set Tour",
    category: "cultural",
    keywords: ["ertuğrul", "film", "set", "ottoman"],
  },
  "203173": {
    name: "Ephesus Day Trip by Flight",
    category: "adventure",
    keywords: ["efes", "flight", "ancient"],
  },
  "681083": {
    name: "Private Bosphorus Tour",
    category: "cruises",
    keywords: ["boğaz", "private", "özel"],
  },
  "696480": {
    name: "Istanbul Aquarium",
    category: "adventure",
    keywords: ["akvaryum", "aquarium", "fish"],
  },
  "176826": {
    name: "Topkapi & Hagia Sophia Tour",
    category: "historical",
    keywords: ["topkapı", "palace", "sultan"],
  },
  "452401": {
    name: "Turkish Coffee Workshop",
    category: "cultural",
    keywords: ["kahve", "coffee", "fortune", "fal"],
  },
  "26992": {
    name: "Cappadocia Hot Air Balloon",
    category: "adventure",
    keywords: ["kapadokya", "balloon", "sunrise"],
  },
  "192789": {
    name: "Topkapi Palace & Harem",
    category: "historical",
    keywords: ["topkapı", "harem", "palace"],
  },
  "618558": {
    name: "Hagia Sophia Audio Guide",
    category: "historical",
    keywords: ["ayasofya", "audio", "guide"],
  },
  "236532": {
    name: "Airport Transfer Service",
    category: "private",
    keywords: ["airport", "transfer", "havalimanı"],
  },
  "477182": {
    name: "24/7 Airport Shuttle",
    category: "private",
    keywords: ["airport", "shuttle", "transport", "ist"],
  },
  "495350": {
    name: "Public Transportation Card",
    category: "private",
    keywords: ["transport", "card", "metro", "bus"],
  },
  "744461": {
    name: "Perfume Making Workshop",
    category: "cultural",
    keywords: ["perfume", "workshop", "scent", "atelier"],
  },
  "740796": {
    name: "Turkish Food Night & Rooftop",
    category: "food",
    keywords: ["food", "rooftop", "night", "turkish"],
  },
  "440016": {
    name: "Guided Segway Tour",
    category: "walking",
    keywords: ["segway", "tour", "old", "town"],
  },
  "614524": {
    name: "Stained Glass Painting Workshop",
    category: "cultural",
    keywords: ["glass", "painting", "art", "workshop"],
  },
  "41496": {
    name: "Gallipoli ANZAC Full Day Tour",
    category: "historical",
    keywords: ["gallipoli", "anzac", "war", "memorial"],
  },
};

/**
 * Get tours by multiple criteria
 */
export function getFilteredTours(
  category?: TourCategory,
  searchQuery?: string,
  limit?: number,
): string[] {
  let tourIds = getAllTourIds();

  // Filter by category
  if (category) {
    tourIds = getToursByCategory(category);
  }

  // Filter by search query
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    tourIds = tourIds.filter((tourId) => {
      const metadata = TOUR_METADATA[tourId];
      if (!metadata) return false;

      return (
        metadata.name.toLowerCase().includes(query) ||
        metadata.keywords.some((keyword) =>
          keyword.toLowerCase().includes(query),
        )
      );
    });
  }

  // Apply limit
  if (limit) {
    tourIds = tourIds.slice(0, limit);
  }

  return tourIds;
}

/**
 * Get tour metadata by ID
 */
export function getTourMetadata(tourId: string) {
  return TOUR_METADATA[tourId] || null;
}

// Note: Price formatting removed - handled by GetYourGuide widgets

// Declare global GetYourGuide object
declare global {
  interface Window {
    gyg?: {
      init: () => void;
    };
  }
}
