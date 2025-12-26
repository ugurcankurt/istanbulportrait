// GetYourGuide Widget TypeScript definitions

export interface GetYourGuideWidgetConfig {
  tourId: string;
  locale: string;
  currency: "EUR" | "USD" | "GBP";
  variant: "vertical" | "horizontal" | "compact";
  partnerId: string;
  campaign: string;
}

// Note: StaticTourData interface removed - using widgets only

export type TourCategory =
  | "historical"
  | "photography"
  | "food"
  | "cruises"
  | "walking"
  | "private"
  | "cultural"
  | "adventure";

// Popular Istanbul Tours for GetYourGuide
export const ISTANBUL_TOURS = {
  // Priority Bosphorus Tours (should be shown first)
  BOSPHORUS_SIGHTSEEING_CRUISE: "653610", // Daytime/Sunset Sightseeing Cruise
  BOSPHORUS_3H_DAY_CRUISE: "854046", // 3-Hour Day Cruise with Asian Side
  BOSPHORUS_SUNSET_BOAT: "418223", // Sunset Boat Cruise
  BOSPHORUS_AUDIO_CRUISE: "461969", // Sightseeing Cruise with Audio
  BOSPHORUS_SUNSET_DRINKS: "764101", // Sunset Cruise with Drinks
  BOSPHORUS_SUNSET_YACHT: "648978", // Sunset Bosphorus Yacht
  BOSPHORUS_SUNSET_CANAPES: "426934", // Sunset Cruise with Canapés
  BOSPHORUS_DINNER_SHOW: "438511", // Dinner Cruise with Turkish Show
  BOSPHORUS_DINNER_CRUISE: "415437", // Dinner Cruise with Private Table
  BOSPHORUS_TURKISH_NIGHT: "419108", // Dinner Cruise with Turkish Night Show
  ISTANBUL_YACHT_TOUR: "449332", // Istanbul Yacht Tour

  // Historical & Cultural Tours
  DOLMABAHCE_PALACE: "558094", // Dolmabahce Palace Fast Track
  MOSAIC_WORKSHOP: "975641", // Mozaik Lamba Atölyesi
  TURKISH_BATH_SPA: "593344", // Özel Türk Hamamı, Masaj ve Spa
  WHIRLING_DERVISHES: "21283", // Semazen Gösterisi
  HAGIA_SOPHIA_SKIP_LINE: "597339", // Ayasofya Hızlı Giriş Bileti
  TURKISH_BATH_SAUNA: "467821", // Özel Türk Hamamı, Sauna ve Masaj
  CAPPADOCIA_2_DAYS: "396081", // 2 Günlük Kapadokya Gezisi
  ERTUGRUL_FILM_SET: "543562", // Ertuğrul/Osman Gazi Film Seti Turu
  EPHESUS_DAY_TRIP: "203173", // Uçakla Günübirlik Efes Gezisi
  PRIVATE_BOSPHORUS_TOUR: "681083", // Özel Boğaz Turu
  ISTANBUL_AQUARIUM: "696480", // İstanbul Akvaryum
  TOPKAPI_HAGIA_SOPHIA: "176826", // Küçük Grup Topkapı ve Ayasofya Turu
  TURKISH_COFFEE_WORKSHOP: "452401", // Turkish Coffee Making Workshop
  CAPPADOCIA_BALLOON: "26992", // Cappadocia Hot Air Balloon
  TOPKAPI_PALACE_HAREM: "192789", // Topkapi Palace and Harem
  HAGIA_SOPHIA_AUDIO: "618558", // Hagia Sophia Audio Guide
  AIRPORT_TRANSFER: "236532", // Istanbul Airport Transfer
  AIRPORT_SHUTTLE: "477182", // 24/7 Airport Shuttle
  TRANSPORT_CARD: "495350", // Public Transportation Card
  PERFUME_WORKSHOP: "744461", // Perfume Making Workshop
  FOOD_ROOFTOP_NIGHT: "740796", // Turkish Food Night & Rooftop
  SEGWAY_OLD_TOWN: "440016", // Guided Segway Tour
  STAINED_GLASS_WORKSHOP: "614524", // Stained Glass Painting Workshop
  GALLIPOLI_ANZAC: "41496", // Gallipoli ANZAC Full Day Tour
} as const;

// Tour categories for filtering
export const TOUR_CATEGORIES: Record<TourCategory, string[]> = {
  historical: [
    ISTANBUL_TOURS.DOLMABAHCE_PALACE,
    ISTANBUL_TOURS.HAGIA_SOPHIA_SKIP_LINE,
    ISTANBUL_TOURS.TOPKAPI_HAGIA_SOPHIA,
    ISTANBUL_TOURS.TOPKAPI_PALACE_HAREM,
    ISTANBUL_TOURS.HAGIA_SOPHIA_AUDIO,
    ISTANBUL_TOURS.GALLIPOLI_ANZAC,
  ],
  photography: [],
  food: [ISTANBUL_TOURS.FOOD_ROOFTOP_NIGHT],
  cruises: [
    // Priority Bosphorus Tours (shown first)
    ISTANBUL_TOURS.BOSPHORUS_SIGHTSEEING_CRUISE,
    ISTANBUL_TOURS.BOSPHORUS_3H_DAY_CRUISE,
    ISTANBUL_TOURS.BOSPHORUS_SUNSET_BOAT,
    ISTANBUL_TOURS.BOSPHORUS_AUDIO_CRUISE,
    ISTANBUL_TOURS.BOSPHORUS_SUNSET_DRINKS,
    ISTANBUL_TOURS.BOSPHORUS_SUNSET_YACHT,
    ISTANBUL_TOURS.BOSPHORUS_SUNSET_CANAPES,
    ISTANBUL_TOURS.BOSPHORUS_DINNER_SHOW,
    ISTANBUL_TOURS.BOSPHORUS_DINNER_CRUISE,
    ISTANBUL_TOURS.BOSPHORUS_TURKISH_NIGHT,
    ISTANBUL_TOURS.ISTANBUL_YACHT_TOUR,
    ISTANBUL_TOURS.PRIVATE_BOSPHORUS_TOUR,
  ],
  walking: [ISTANBUL_TOURS.SEGWAY_OLD_TOWN],
  private: [
    ISTANBUL_TOURS.TURKISH_BATH_SPA,
    ISTANBUL_TOURS.TURKISH_BATH_SAUNA,
    ISTANBUL_TOURS.AIRPORT_TRANSFER,
    ISTANBUL_TOURS.AIRPORT_SHUTTLE,
    ISTANBUL_TOURS.TRANSPORT_CARD,
  ],
  cultural: [
    ISTANBUL_TOURS.MOSAIC_WORKSHOP,
    ISTANBUL_TOURS.WHIRLING_DERVISHES,
    ISTANBUL_TOURS.ERTUGRUL_FILM_SET,
    ISTANBUL_TOURS.TURKISH_COFFEE_WORKSHOP,
    ISTANBUL_TOURS.PERFUME_WORKSHOP,
    ISTANBUL_TOURS.STAINED_GLASS_WORKSHOP,
  ],
  adventure: [
    ISTANBUL_TOURS.CAPPADOCIA_2_DAYS,
    ISTANBUL_TOURS.EPHESUS_DAY_TRIP,
    ISTANBUL_TOURS.ISTANBUL_AQUARIUM,
    ISTANBUL_TOURS.CAPPADOCIA_BALLOON,
  ],
};

// Note: STATIC_TOUR_DATA removed - using GetYourGuide widgets only

// Locale mapping for GetYourGuide
// Note: Arabic falls back to English as GetYourGuide doesn't support Arabic
export const GETYOURGUIDE_LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  ru: "ru-RU",
  fr: "fr-FR",
  de: "de-DE",
  ro: "ro-RO",
  ar: "en-US", // Fallback to English - GetYourGuide doesn't support Arabic
  zh: "zh-CN", // Simplified Chinese
};

// Partner configuration
export const GETYOURGUIDE_CONFIG = {
  PARTNER_ID: "S6XXHTA",
  CAMPAIGN: "istanbul",
  BASE_URL: "https://www.getyourguide.com",
  WIDGET_URL: "https://widget.getyourguide.com",
  CURRENCY: "EUR",
} as const;

// Helper function to get tour by category
export function getToursByCategory(category: TourCategory): string[] {
  return TOUR_CATEGORIES[category] || [];
}

// Note: getStaticTourData removed - using widgets only

// Helper function to build booking URL
// Note: Arabic locale falls back to English as GetYourGuide doesn't support Arabic
export function buildBookingUrl(tourId: string, locale: string = "en"): string {
  // Use English fallback for Arabic since GetYourGuide doesn't support Arabic
  const gygLocale =
    locale === "ar" ? "en-US" : GETYOURGUIDE_LOCALE_MAP[locale] || "en-US";
  return `${GETYOURGUIDE_CONFIG.BASE_URL}/activity/t${tourId}?partner_id=${GETYOURGUIDE_CONFIG.PARTNER_ID}&cmp=${GETYOURGUIDE_CONFIG.CAMPAIGN}&locale=${gygLocale}`;
}
