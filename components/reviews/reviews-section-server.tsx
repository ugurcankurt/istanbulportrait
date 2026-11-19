import { reviewsService } from "@/lib/reviews-service";
import { ReviewsClient } from "./reviews-client";

// Server component for Reviews

export async function ReviewsSection({
  locale = "en",
  header,
}: {
  locale?: string;
  header?: React.ReactNode;
} = {}) {
  try {
    // Fetch reviews on server-side only
    const { reviews } = await reviewsService.fetchGoogleReviews(locale);
    const aggregateRating = await reviewsService.getAggregateRating();

    // Only render if we have reviews
    if (!reviews || reviews.length === 0) {
      return null; // Don't render empty reviews section
    }

    // Limit homepage carousel to 12 most recent reviews to cut ~180 inline SVG stars & ~140 KB DOM bloat
    // (aggregateRating still reflects the full review count)
    const displayReviews = reviews.slice(0, 12);

    // Pass data to client component for UI rendering
    return (
      <ReviewsClient
        reviews={displayReviews}
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
