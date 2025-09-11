/**
 * SEO Configuration for Istanbul Photographer
 * Central SEO settings and metadata configuration
 */

export const SEO_CONFIG = {
  site: {
    name: "Istanbul Photographer",
    url: "https://istanbulportrait.com",
    title: "Photographer in Istanbul | Most Popular Photographer in Istanbul",
    description:
      "Expert photographer in Istanbul for professional portrait and lifestyle photography sessions. Capture your memories with stunning rooftop views and historic landmarks.",
    locale: "en_US",
    type: "website",
  },

  organization: {
    name: "Istanbul Photographer",
    type: "ProfessionalService",
    url: "https://istanbulportrait.com",
    logo: "https://istanbulportrait.com/istanbulportrait_white_logo.png",
    sameAs: [
      "https://www.instagram.com/istanbulportrait",
      "https://www.facebook.com/istanbulportrait",
      "https://www.linkedin.com/company/istanbulportrait",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "TR",
      addressLocality: "Istanbul",
      addressRegion: "Istanbul",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+905367093724",
      contactType: "customer service",
      areaServed: "TR",
      availableLanguage: ["en", "tr", "ar", "ru", "es"],
    },
  },

  person: {
    name: "Uğur Cankurt",
    type: "Person",
    jobTitle: "Professional Photographer",
    url: "https://istanbulportrait.com/about",
    image: "https://istanbulportrait.com/istanbulportprat_ugur_cankurt.jpg",
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
    ogImage: "https://istanbulportrait.com/og-image.jpg",
    logo: "https://istanbulportrait.com/istanbulportrait_white_logo.png",
    favicon: "https://istanbulportrait.com/favicon.ico",
    gallery: [
      "https://istanbulportrait.com/gallery/istanbul_photographer_1.jpg",
      "https://istanbulportrait.com/gallery/istanbul_couple_photoshoot.jpg",
      "https://istanbulportrait.com/gallery/istanbul_rooftop_photoshoot.jpg",
      "https://istanbulportrait.com/gallery/couple_photoshoot_in_istanbul.jpg",
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

export type SEOConfig = typeof SEO_CONFIG;
