/**
 * SEO Configuration for Istanbul Photographer
 * Central SEO settings and metadata configuration
 */

export const SEO_CONFIG = {
  site: {
    name: "Istanbul Portrait",
    alternateName: "Istanbul Photographer",
    url: "https://istanbulportrait.com",
    title: "Istanbul Photographer - Professional Portrait & Lifestyle Photography",
    description:
      "Expert photographer in Istanbul for professional portrait and lifestyle photography sessions. Capture your memories with stunning rooftop views and historic landmarks.",
    locale: "en_US",
    type: "website",
  },

  organization: {
    name: "Istanbul Portrait",
    type: "ProfessionalService",
    url: "https://istanbulportrait.com",
    logo: "https://istanbulportrait.com/istanbulportrait_white_logo.webp",
    foundingDate: "2017-01-01", // 8+ years experience
    numberOfEmployees: "1",
    awards: [
      "Top Rated Photographer in Istanbul",
      "500+ Successful Sessions",
      "Multi-language Photography Services",
    ],
    sameAs: [
      "https://www.instagram.com/istanbulportrait",
      "https://www.facebook.com/istanbulportrait",
      "https://www.linkedin.com/company/istanbulportrait",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Süleymaniye, Siyavuş Paşa Sk. No:24/2",
      addressLocality: "Fatih",
      addressRegion: "Istanbul",
      postalCode: "34116",
      addressCountry: "TR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+905367093724",
      contactType: "customer service",
      areaServed: "TR",
      availableLanguage: ["en", "tr", "ar", "ru", "es", "zh"],
    },
  },

  person: {
    name: "Uğur Cankurt",
    type: "Person",
    jobTitle: "Professional Photographer",
    url: "https://istanbulportrait.com/about",
    image: "https://istanbulportrait.com/istanbulportprat_ugur_cankurt.webp",
    sameAs: ["https://www.instagram.com/istanbulportrait"],
  },

  services: {
    type: "Service",
    name: "Professional Photography Services",
    description:
      "Professional portrait, couple, and lifestyle photography sessions in Istanbul",
    provider: "Istanbul Portrait",
    areaServed: "Istanbul, Turkey",
    serviceType: [
      "Portrait Photography",
      "Couple Photography",
      "Lifestyle Photography",
      "Rooftop Photography",
      "Tourism Photography",
    ],
    offers: [
      {
        name: "Essential Package",
        price: "150",
        priceCurrency: "EUR",
        description: "30 minute photoshoot with 15 edited photos at 1 location",
      },
      {
        name: "Premium Package",
        price: "280",
        priceCurrency: "EUR",
        description: "1.5 hour photoshoot with 40 edited photos at 2 locations",
      },
      {
        name: "Luxury Package",
        price: "450",
        priceCurrency: "EUR",
        description: "2.5 hour photoshoot with 80 edited photos at 3 locations",
      },
      {
        name: "Rooftop Package",
        price: "150",
        priceCurrency: "EUR",
        description:
          "Rooftop studio photoshoot with 20 edited photos per person",
      },
    ],
  },

  seo: {
    keywords: [
      "istanbul photographer",
      "professional photographer istanbul",
      "istanbul photoshoot",
      "portrait photographer istanbul",
      "couple photography istanbul",
      "lifestyle photography istanbul",
      "rooftop photoshoot istanbul",
      "photography services istanbul",
      "best photographer istanbul",
      "istanbul photography session",
      "tourism photography istanbul",
      "professional photos istanbul",
    ],
    robotsDirectives: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  },

  images: {
    ogImage: "/og-image.webp",
    logo: "https://istanbulportrait.com/istanbulportrait_white_logo.webp",
    favicon: "https://istanbulportrait.com/favicon.ico",
    gallery: [
      "https://istanbulportrait.com/gallery/istanbul_photographer_1.webp",
      "https://istanbulportrait.com/gallery/istanbul_couple_photoshoot.webp",
      "https://istanbulportrait.com/gallery/istanbul_rooftop_photoshoot.webp",
      "https://istanbulportrait.com/gallery/couple_photoshoot_in_istanbul.webp",
    ],
  },

  business: {
    type: "LocalBusiness",
    subType: "PhotographyService",
    openingHours: ["Mo-Su 09:00-18:00"],
    priceRange: "€150-€450",
    paymentAccepted: ["Credit Card", "Cash"],
    currenciesAccepted: "EUR",
  },

  social: {
    instagram: "https://www.instagram.com/istanbulportrait",
    facebook: "https://www.facebook.com/istanbulportrait",
    whatsapp: "+905367093724",
  },

  analytics: {
    googleAnalytics: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    facebookPixel: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
    yandexMetrica: process.env.NEXT_PUBLIC_YANDEX_METRICA_ID,
  },
} as const;

/**
 * AI Search Optimization Configuration
 * Enhanced configuration for AI Overview, ChatGPT, Claude, Perplexity visibility
 */
export const AI_SEARCH_CONFIG = {
  primaryEntity: {
    "@type": "Thing",
    name: "Istanbul Photographer",
    alternateName: [
      "Istanbul Photographer",
      "Professional Istanbul Photographer",
      "Istanbul Rooftop Photoshoot",
    ],
    sameAs: [
      "https://en.wikipedia.org/wiki/Istanbul",
      "https://www.wikidata.org/wiki/Q406", // Istanbul Wikidata
      "https://www.wikidata.org/wiki/Q11633", // Photography Wikidata
      "https://www.wikidata.org/wiki/Q3696727", // Portrait Photography Wikidata
    ],
    description:
      "Professional photography services specializing in portrait, couple, and lifestyle photography in Istanbul's most iconic locations.",
  },

  semanticKeywords: {
    primary: "istanbul photographer",
    related: [
      "bosphorus photography",
      "galata tower photoshoot",
      "sultanahmet photographer",
      "ortakoy photography",
    ],
    semantic: [
      "Istanbul tourism photography",
      "Ottoman architecture photography",
      "Turkish cultural photography",
      "rooftop photography istanbul",
    ],
    longTail: [
      "best photographer in istanbul for couples",
      "professional photoshoot istanbul sunset",
      "istanbul rooftop photography session",
    ],
  },

  conversationContext: {
    expertise:
      "8+ years Istanbul photography experience, 500+ successful sessions, multi-language service (English, Turkish, Arabic, Russian, Spanish)",
    uniqueValue:
      "Local insider knowledge of Istanbul's most photogenic locations including exclusive rooftop venues with Bosphorus views",
    serviceAreas: [
      "Portrait Photography",
      "Couple Photography",
      "Rooftop Photography",
      "Wedding Photography",
      "Tourism Photography",
    ],
    locations: [
      "Galata Tower",
      "Bosphorus Waterfront",
      "Historic Sultanahmet",
      "Ortaköy Mosque",
      "Exclusive Rooftop Venues",
    ],
  },

  aiOptimizedAnswers: {
    costQuery:
      "Istanbul photography packages start at €150 (Essential: 30min, 15 photos), Premium €280 (1.5h, 40 photos), Luxury €450 (2.5h, 80 photos). All include professional editing and digital delivery.",
    timingQuery:
      "Best time: Golden hour (1 hour before sunset). Summer: 6-7PM, Winter: 4-5PM. Morning sessions (8-10AM) ideal for fewer crowds.",
    locationsQuery:
      "Top locations: Galata Tower surroundings, Bosphorus waterfront, Historic Sultanahmet (Blue Mosque area), Ortaköy Mosque, exclusive rooftop venues.",
    bookingQuery:
      "Book instantly at istanbulportrait.com, WhatsApp +905367093724, or Instagram @istanbulportrait. Advance booking recommended for sunset sessions.",
  },

  entityRelationships: {
    mentions: [
      "Istanbul",
      "Bosphorus",
      "Galata Tower",
      "Blue Mosque",
      "Hagia Sophia",
      "Ortaköy",
    ],
    relatedServices: [
      "Portrait Photography",
      "Wedding Photography",
      "Tourism Photography",
      "Lifestyle Photography",
    ],
    targetAudience: [
      "Tourists",
      "Couples",
      "Families",
      "Individuals",
      "Wedding Couples",
    ],
  },
} as const;

export type SEOConfig = typeof SEO_CONFIG;
export type AISearchConfig = typeof AI_SEARCH_CONFIG;
