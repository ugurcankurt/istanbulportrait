export interface GoogleReview {
  id: string;
  author: {
    name: string;
    photoUrl?: string;
  };
  rating: number;
  text: string;
  date: string;
  relativeTimeDescription: string;
}

export interface AggregateRating {
  average: number;
  count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsApiResponse {
  reviews: GoogleReview[];
  aggregateRating: AggregateRating;
  totalReviews: number;
  averageRating: number;
}

export interface ReviewsServiceConfig {
  apiKey: string;
  widgetId: string;
  maxReviews?: number;
  sortBy?: "newest" | "highest" | "lowest" | "relevant";
}
