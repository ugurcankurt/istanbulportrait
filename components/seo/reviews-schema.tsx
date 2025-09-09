import { reviewsService } from "@/lib/reviews-service";

interface ReviewsSchemaProps {
  baseUrl?: string;
}

export async function ReviewsSchema({ baseUrl = "https://istanbulportrait.com" }: ReviewsSchemaProps) {
  try {
    // Fetch dynamic reviews and ratings
    const [schemaReviews, aggregateRating] = await Promise.all([
      reviewsService.getSchemaReviews(),
      reviewsService.getSchemaAggregateRating()
    ]);

    // Only render if we have reviews
    if (!schemaReviews.length || aggregateRating.reviewCount === "0") {
      return null;
    }

    const localBusinessWithReviews = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness", 
      "@id": `${baseUrl}#business-reviews`,
      name: "Istanbul Photographer - Google Reviews",
      url: baseUrl,
      // Dynamic Google My Business reviews
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