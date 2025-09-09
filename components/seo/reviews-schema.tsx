import { reviewsService } from "@/lib/reviews-service";

interface ReviewsSchemaProps {
  baseUrl?: string;
}

export async function ReviewsSchema({ baseUrl = "https://istanbulportrait.com" }: ReviewsSchemaProps) {
  try {
    // Use Featurable API for reviews
    const [schemaReviews, aggregateRating] = await Promise.all([
      reviewsService.getSchemaReviews(),
      reviewsService.getSchemaAggregateRating()
    ]);

    // Only render if we have reviews
    if (!schemaReviews.length || aggregateRating.reviewCount === "0") {
      return null;
    }

    // Static LocalBusiness schema with Featurable reviews
    const localBusinessWithReviews = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness", 
      "@id": `${baseUrl}#business`,
      name: "Istanbul Photographer - Professional Photography Services",
      url: baseUrl,
      telephone: "+90-536-709-37-24",
      email: "info@istanbulportrait.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Alemdar, Molla Fenari, Divan Yolu Cd. No:78/A",
        addressLocality: "Istanbul",
        addressRegion: "Istanbul",
        postalCode: "34110",
        addressCountry: "TR",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 41.0084588,
        longitude: 28.9719997,
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday", 
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "00:00",
        closes: "23:59",
      },
      serviceType: ["Photography", "Portrait Photography", "Wedding Photography", "Event Photography"],
      priceRange: "€150-€450",
      paymentAccepted: ["Cash", "Credit Card", "Bank Transfer"],
      currenciesAccepted: ["EUR", "USD", "GBP", "TRY"],
      description: "Professional photography services in Istanbul offering portrait, wedding, and event photography with premium packages and rooftop photoshoots.",
      areaServed: {
        "@type": "City",
        name: "Istanbul",
        addressCountry: "TR",
      },
      image: [
        {
          "@type": "ImageObject",
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          caption: "Istanbul Photographer Professional Photography Services",
        },
      ],
      // Reviews from Featurable API
      review: schemaReviews,
      aggregateRating: aggregateRating,
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessWithReviews) }}
      />
    );
  } catch (error) {
    console.error("Error loading reviews schema:", error);
    return null;
  }
}