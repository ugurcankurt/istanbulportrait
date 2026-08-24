import { NextResponse } from "next/server";
import { getTranslatedReview } from "@/lib/reviews-service";

export async function POST(request: Request) {
  try {
    const { locale, reviews } = await request.json();

    if (!locale || locale === "en") {
      return NextResponse.json({}, { status: 400 });
    }

    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({});
    }

    // Only attempt to translate up to 15 reviews
    const reviewsToTranslate = reviews
      .filter((r: any) => r.text && r.text.trim().length > 0)
      .slice(0, 15);

    if (reviewsToTranslate.length === 0) {
      return NextResponse.json({});
    }

    const translatedDict: Record<string, string> = {};
    const startTime = Date.now();
    const TIME_LIMIT_MS = 7000; // 7 seconds limit to prevent Vercel 10s timeout

    for (const review of reviewsToTranslate) {
      // Check if we're approaching the Vercel execution timeout limit
      if (Date.now() - startTime > TIME_LIMIT_MS) {
        console.warn(`Time limit reached in translation API. Halting at ${Object.keys(translatedDict).length} translations.`);
        break; // Return what we have so far
      }

      try {
        const translatedText = await getTranslatedReview(review.id, review.text, locale);
        if (translatedText && translatedText !== review.text) {
          translatedDict[review.id] = translatedText;
        }
      } catch (err) {
        console.error(`Error translating review ${review.id}:`, err);
        // Continue with the next review
      }
    }

    return NextResponse.json(translatedDict);
  } catch (error) {
    console.error("Error in translation API route:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
