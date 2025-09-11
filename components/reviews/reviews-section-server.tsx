import { reviewsService } from "@/lib/reviews-service";
import { ReviewsClient } from "./reviews-client";
import { 
  JsonLd, 
  generateAggregateRatingSchema, 
  generateReviewsSchema,
  createSchemaConfig,
  type ReviewData
} from "@/lib/structured-data";
import { SEO_CONFIG } from "@/lib/seo-config";

export const revalidate = 3600; // Revalidate every hour

export async function ReviewsSection({ 
  locale = "en" 
}: { 
  locale?: string 
} = {}) {
  try {
    // Fetch reviews on server-side only
    const reviews = await reviewsService.fetchGoogleReviews();
    const aggregateRating = await reviewsService.getAggregateRating();

    // Only render if we have reviews
    if (!reviews || reviews.length === 0) {
      return null; // Don't render empty reviews section
    }

    // Convert reviews to ReviewData format for schema
    const reviewsData: ReviewData[] = reviews.map((review) => ({
      author: review.author?.name || "Anonymous",
      rating: review.rating || 5,
      reviewBody: review.text || "",
      datePublished: review.date || new Date().toISOString(),
    }));

    // Create schema configuration
    const schemaConfig = createSchemaConfig(locale);

    // Generate structured data
    const aggregateRatingSchema = generateAggregateRatingSchema(reviewsData);
    const reviewSchemas = generateReviewsSchema(reviewsData.slice(0, 5), schemaConfig); // Limit to first 5 reviews

    // Create enhanced LocalBusiness schema with reviews
    const localBusinessWithReviews = {
      "@context": "https://schema.org" as const,
      "@type": "LocalBusiness" as const,
      "@id": `${SEO_CONFIG.site.url}/#localbusiness-reviews`,
      name: SEO_CONFIG.organization.name,
      aggregateRating: aggregateRatingSchema,
      review: reviewSchemas.map(schema => ({
        "@type": "Review" as const,
        reviewRating: schema.reviewRating,
        author: schema.author,
        reviewBody: schema.reviewBody,
        datePublished: schema.datePublished,
      })),
    };

    // Pass data to client component for UI rendering
    return (
      <>
        {/* JSON-LD Schema for Reviews */}
        <JsonLd data={localBusinessWithReviews} />
        
        <ReviewsClient reviews={reviews} aggregateRating={aggregateRating} />
      </>
    );
  } catch (error) {
    console.error("Error loading reviews on server:", error);

    // Return null instead of error message to avoid showing incomplete sections
    return null;
  }
}
