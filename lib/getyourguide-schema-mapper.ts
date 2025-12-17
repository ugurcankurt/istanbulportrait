/**
 * GetYourGuide to Schema.org data mapping utilities
 * Basic schema generation for widget-based tours
 */
import { buildBookingUrl } from "@/types/getyourguide";

// Note: Static data conversion functions removed - using widgets only

/**
 * Generate basic tour info for widget-based tours
 */
export function generateBasicTourInfo(tourId: string, locale: string = "en") {
  return {
    tourId: tourId,
    bookingUrl: buildBookingUrl(tourId, locale),
    location: "Istanbul, Turkey",
    provider: "GetYourGuide",
    cancellation: "Free cancellation available - check booking terms",
  };
}

/**
 * Generate basic breadcrumb data for tour pages
 */
export function generateTourBreadcrumbs(
  tourId: string,
  baseUrl: string,
  locale: string = "en",
) {
  return [
    { name: "Home", url: `${baseUrl}/${locale}`, position: 1 },
    { name: "Tours", url: `${baseUrl}/${locale}/tours`, position: 2 },
    {
      name: "Tour Details",
      url: `${baseUrl}/${locale}/tours/${tourId}`,
      position: 3,
    },
  ];
}

/**
 * Generate basic rich snippet data for tour
 */
export function generateBasicTourSchema(tourId: string, locale: string = "en") {
  const tourInfo = generateBasicTourInfo(tourId, locale);

  return {
    "@type": "TouristAttraction",
    "@id": `https://istanbulportrait.com/tours/${tourId}`,
    location: {
      "@type": "Place",
      name: "Istanbul, Turkey",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Istanbul",
        addressCountry: "TR",
      },
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: tourInfo.bookingUrl,
      seller: {
        "@type": "Organization",
        name: "GetYourGuide",
        url: "https://www.getyourguide.com",
      },
    },
  };
}

/**
 * Generate JSON-LD structured data for tours listing
 */
export function generateToursListingSchema(
  tourIds: string[],
  baseUrl: string,
  locale: string = "en",
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Istanbul Tours & Activities",
    description: "Discover the best tours and activities in Istanbul",
    url: `${baseUrl}/${locale}/tours`,
    numberOfItems: tourIds.length,
    itemListElement: tourIds.map((tourId, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: generateBasicTourSchema(tourId, locale),
    })),
  };
}

// Note: Category mapping functions removed - handled by widgets

/**
 * Generate FAQ schema for common tour questions
 */
export function generateTourFAQSchema(locale: string = "en") {
  const faqMap: Record<string, Array<{ question: string; answer: string }>> = {
    en: [
      {
        question: "How do I book a tour in Istanbul?",
        answer:
          "You can easily book tours through our GetYourGuide widgets on each tour page. Simply select your preferred date and complete the booking process.",
      },
      {
        question: "Are the tours available in multiple languages?",
        answer:
          "Yes, many tours offer guides speaking English, Turkish, Arabic, Russian, and Spanish. Check individual tour details for language availability.",
      },
      {
        question: "What is the cancellation policy?",
        answer:
          "Most tours offer free cancellation up to 24 hours before the tour date. Specific cancellation terms are available on each tour's booking page.",
      },
      {
        question: "Can I combine photography sessions with tours?",
        answer:
          "Absolutely! We offer special packages that combine professional photography sessions with guided tours for the ultimate Istanbul experience.",
      },
    ],
    // Add other languages as needed
  };

  const faqs = faqMap[locale] || faqMap.en;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
