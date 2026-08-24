import { NextResponse } from "next/server";
import { getTranslatedReviewsBatch } from "@/lib/reviews-service";

export async function POST(request: Request) {
  try {
    const { locale, reviews } = await request.json();

    if (!locale || locale === "en") {
      return NextResponse.json({}, { status: 400 });
    }

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({});
    }

    // Only translate the first 15 reviews to save API costs and improve speed
    const reviewsToTranslate = reviews
      .filter((r: any) => r.text && r.text.trim().length > 0)
      .slice(0, 15)
      .map((r: any) => ({ id: r.id, text: r.text }));

    if (reviewsToTranslate.length === 0) {
      return NextResponse.json({});
    }

    const payloadStr = JSON.stringify(reviewsToTranslate);
    
    // This calls the unstable_cache function from reviews-service
    const translatedDict = await getTranslatedReviewsBatch(payloadStr, locale);

    return NextResponse.json(translatedDict);
  } catch (error) {
    console.error("Error in translation API route:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
