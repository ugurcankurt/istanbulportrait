import type {
  AggregateRating,
  GoogleReview,
  ReviewsServiceConfig,
} from "@/types/reviews";

/**
 * Truncate review text to specified length while preserving word boundaries
 */
function truncateReviewText(text: string, maxLength: number = 150): string {
  if (!text || text.length <= maxLength) return text;

  // Find last complete word before max length
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  // If no space found, just truncate at max length
  if (lastSpace === -1) return truncated + "...";

  // Return text up to last complete word
  const result = truncated.substring(0, lastSpace);

  // Add ellipsis if we actually truncated
  return result + (text.length > lastSpace ? "..." : "");
}

class ReviewsService {
  private config: ReviewsServiceConfig;

  constructor(config: ReviewsServiceConfig) {
    this.config = config;
  }

  /**
   * Fetch reviews from Featurable API
   */
  async fetchGoogleReviews(): Promise<GoogleReview[]> {
    try {
      const response = await fetch(
        `https://featurable.com/api/v1/widgets/${this.config.widgetId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Cache for 1 hour
          next: { revalidate: 3600 },
        },
      );

      if (!response.ok) {
        throw new Error(`Featurable API error: ${response.status}`);
      }

      const data = await response.json();

      // Featurable API response structure adaptation
      const reviews = data.reviews || [];

      // Transform to our GoogleReview interface
      const transformedReviews: GoogleReview[] = reviews.map((review: any) => ({
        id: review.id || String(Math.random()),
        author: {
          name: review.reviewer?.displayName || "Anonymous",
          photoUrl: review.reviewer?.profilePhotoUrl,
        },
        rating: Number(review.starRating) || 5,
        text: truncateReviewText(review.comment || "", 150),
        date: review.createTime || new Date().toISOString(),
        relativeTimeDescription:
          review.relativePublishTimeDescription || "Recent",
      }));

      // Sort by date (newest first) and limit results
      const sortedReviews = transformedReviews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, this.config.maxReviews || 10);

      return sortedReviews;
    } catch (error) {
      console.error("Error fetching Google reviews:", error);

      // Return fallback data if API fails
      return this.getFallbackReviews();
    }
  }

  /**
   * Calculate aggregate rating from reviews
   */
  async getAggregateRating(): Promise<AggregateRating> {
    try {
      const reviews = await this.fetchGoogleReviews();

      if (reviews.length === 0) {
        return this.getFallbackAggregateRating();
      }

      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      );
      const average = Math.round((totalRating / reviews.length) * 10) / 10;

      // Calculate rating distribution
      const distribution = {
        1: reviews.filter((r) => r.rating === 1).length,
        2: reviews.filter((r) => r.rating === 2).length,
        3: reviews.filter((r) => r.rating === 3).length,
        4: reviews.filter((r) => r.rating === 4).length,
        5: reviews.filter((r) => r.rating === 5).length,
      };

      return {
        average,
        count: reviews.length,
        distribution,
      };
    } catch (error) {
      console.error("Error calculating aggregate rating:", error);
      return this.getFallbackAggregateRating();
    }
  }

  /**
   * Get reviews formatted for Schema.org markup
   */
  async getSchemaReviews(): Promise<any[]> {
    const reviews = await this.fetchGoogleReviews();

    return reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author.name,
        ...(review.author.photoUrl && { image: review.author.photoUrl }),
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating.toString(),
        bestRating: "5",
        worstRating: "1",
      },
      reviewBody: review.text,
      datePublished: review.date,
    }));
  }

  /**
   * Get aggregate rating formatted for Schema.org markup
   */
  async getSchemaAggregateRating(): Promise<any> {
    const aggregateRating = await this.getAggregateRating();

    return {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.average.toString(),
      reviewCount: aggregateRating.count.toString(),
      bestRating: "5",
      worstRating: "1",
    };
  }

  /**
   * Fallback reviews when API is not available
   */
  private getFallbackReviews(): GoogleReview[] {
    return [
      {
        id: "fallback-1",
        author: { name: "Istanbul Client" },
        rating: 5,
        text: "Professional photography service in Istanbul. Highly recommended! Amazing experience with beautiful photos and great customer service.",
        date: new Date().toISOString().split("T")[0],
        relativeTimeDescription: "Recent review",
      },
    ];
  }

  /**
   * Fallback aggregate rating
   */
  private getFallbackAggregateRating(): AggregateRating {
    return {
      average: 4.8,
      count: 1,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
    };
  }
}

// Export singleton instance
export const reviewsService = new ReviewsService({
  apiKey: process.env.FEATURABLE_API_KEY || "",
  widgetId:
    process.env.FEATURABLE_WIDGET_ID || "94e04b2d-aa06-4057-b95b-f09a8fcf5f38",
  maxReviews: 10,
  sortBy: "newest",
});

export default ReviewsService;
