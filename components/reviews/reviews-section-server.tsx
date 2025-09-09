import { reviewsService } from '@/lib/reviews-service';
import { ReviewsClient } from './reviews-client';

export const revalidate = 3600; // Revalidate every hour

export async function ReviewsSection() {
  try {
    // Fetch reviews on server-side only
    const reviews = await reviewsService.fetchGoogleReviews();
    const aggregateRating = await reviewsService.getAggregateRating();

    // Only render if we have reviews
    if (!reviews || reviews.length === 0) {
      return null; // Don't render empty reviews section
    }

    // Pass data to client component for UI rendering
    return <ReviewsClient reviews={reviews} aggregateRating={aggregateRating} />;
  } catch (error) {
    console.error('Error loading reviews on server:', error);
    
    // Return null instead of error message to avoid showing incomplete sections
    return null;
  }
}