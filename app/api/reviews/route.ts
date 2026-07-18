import { reviewsService } from "@/lib/reviews-service";
import { NextResponse } from "next/server";

export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const { reviews, totalCount } = await reviewsService.fetchGoogleReviews();
    const aggregateRating = await reviewsService.getAggregateRating();

    return NextResponse.json({
      reviews,
      aggregateRating,
      totalReviews: totalCount,
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
