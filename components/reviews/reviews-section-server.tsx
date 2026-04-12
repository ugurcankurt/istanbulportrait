import { reviewsService } from "@/lib/reviews-service";
import { ReviewsClient } from "./reviews-client";

// Revalidate every hour
export const revalidate = 3600;

export async function ReviewsSection({
  locale = "en",
  header,
}: {
  locale?: string;
  header?: React.ReactNode;
} = {}) {
  try {
    // Fetch reviews on server-side only
    const { reviews } = await reviewsService.fetchGoogleReviews();
    const aggregateRating = await reviewsService.getAggregateRating();

    // Only render if we have reviews
    if (!reviews || reviews.length === 0) {
      return null; // Don't render empty reviews section
    }

    // Pass data to client component for UI rendering
    return (
      <ReviewsClient
        reviews={reviews}
        aggregateRating={aggregateRating}
        header={header}
      />
    );
  } catch (error) {
    console.error("Error loading reviews on server:", error);

    // Return null instead of error message to avoid showing incomplete sections
    return null;
  }
}
