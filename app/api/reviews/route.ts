import { NextResponse } from "next/server";
import { reviewsService } from "@/lib/reviews-service";

export async function GET() {
  try {
    const reviews = await reviewsService.fetchGoogleReviews();
    const aggregateRating = await reviewsService.getAggregateRating();

    return NextResponse.json({
      reviews,
      aggregateRating,
      totalReviews: reviews.length,
      averageRating: aggregateRating.average,
    });
  } catch (error) {
    console.error("Error in reviews API:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
