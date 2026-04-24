import { unstable_cache } from "next/cache";
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

/**
 * Internal helper to translate a batch of reviews via Gemini.
 * We use unstable_cache so the translation is persistently cached.
 * Since 'reviewsStr' is passed as an argument, Next.js automatically includes it in the cache key.
 * This guarantees that when a new review arrives, the cache key changes and we fetch new translations!
 */
const getTranslatedReviews = unstable_cache(
  async (reviewsStr: string, locale: string) => {
    if (locale === "en") return JSON.parse(reviewsStr) as GoogleReview[];
    const reviews: GoogleReview[] = JSON.parse(reviewsStr);

    const reviewsToTranslate = reviews.filter(r => r.text && r.text.trim().length > 0);
    if (reviewsToTranslate.length === 0) return reviews;

    try {
      const { settingsService } = await import('@/lib/settings-service');
      const settings = await settingsService.getSettings();
      const apiKey = settings.gemini_api_key;
      
      if (!apiKey) {
        console.warn("No Gemini API key found for review translation.");
        return reviews;
      }

      // Prepare payload with just IDs and text to save tokens
      const payload = reviewsToTranslate.map(r => ({ id: r.id, text: r.text }));

      const prompt = `
You are a professional localization expert. Translate the following user reviews from their original language into the language code: "${locale}".
Maintain the original tone, which is likely positive and related to a photography business in Istanbul.
Return ONLY a valid minified JSON object where the keys are the review IDs and the values are the translated texts. Do not include markdown formatting like \`\`\`json.
Example output format:
{"review-1": "Harika bir deneyimdi!", "review-2": "Çok profesyonel bir ekip."}

Reviews to translate:
${JSON.stringify(payload)}
`;

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          }
        })
      });

      if (!response.ok) {
        console.error("Gemini API Error for reviews translation:", await response.text());
        return reviews;
      }

      const data = await response.json();
      let textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textOutput) return reviews;

      // Clean markdown block if Gemini still returns it
      textOutput = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();

      const translatedDict = JSON.parse(textOutput);

      // Map translations back to the reviews array
      return reviews.map(r => {
        if (translatedDict[r.id]) {
          return { ...r, text: translatedDict[r.id] };
        }
        return r;
      });
    } catch (err) {
      console.error("Failed to translate reviews:", err);
      return reviews; // fallback to original if failed
    }
  },
  ['gemini-reviews-translations-v1'],
  { revalidate: 86400 * 7 } // Cache for 7 days. When reviews change, a new cache key is auto-generated.
);

class ReviewsService {
  private config: ReviewsServiceConfig;

  constructor(config: ReviewsServiceConfig) {
    this.config = config;
  }

  /**
   * Fetch reviews from Featurable API dynamically
   */
  async fetchGoogleReviews(locale: string = "en"): Promise<{ reviews: GoogleReview[], totalCount: number, averageRating: number }> {
    try {
      // 1. Fetch dynamic configuration from CMS
      const { pagesContentService } = await import('@/lib/pages-content-service');
      const pageData = await pagesContentService.getPageBySlug("home-reviews");
      const rawInput = pageData?.content?.featurable_code || "";

      // 2. Safely extract the UUID from the raw configuration (it could be a script tag, a URL, or just the ID)
      const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
      const match = rawInput.match(uuidRegex);
      
      let activeWidgetId = match ? match[0] : null;

      // 3. Fallback to .env config if CMS is unconfigured
      if (!activeWidgetId) {
        const { settingsService } = await import('@/lib/settings-service');
        const settings = await settingsService.getSettings();
        activeWidgetId = settings.featurable_widget_id || this.config.widgetId;
      }

      if (!activeWidgetId) {
        console.warn("ReviewsService: No Featurable Widget ID configured. Returning empty reviews gracefully.");
        return {
          reviews: [],
          totalCount: 0,
          averageRating: 5,
        };
      }

      const response = await fetch(
        `https://featurable.com/api/v1/widgets/${activeWidgetId}?minRating=3&sortBy=newest&hideEmptyReviews=false`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Cache for 24 hours to stay dynamic while mitigating API limit hits
          next: { revalidate: 86400, tags: ["reviews"] },
        },
      );

      if (!response.ok) {
        throw new Error(`Featurable API error: ${response.status}`);
      }

      const data = await response.json();

      // Featurable API response structure adaptation
      const reviews = data.reviews || [];
      const totalCount = Number(data.totalReviewCount) || reviews.length;
      const averageRatingRaw = Number(data.averageRating) || 5;
      const averageRating = Math.round(averageRatingRaw * 10) / 10;

      // Transform to our GoogleReview interface
      const transformedReviews: GoogleReview[] = reviews.map((review: any, index: number) => ({
        id: review.id || `review-${review.reviewer?.displayName || "anon"}-${review.createTime || index}`,
        author: {
          name: review.reviewer?.displayName || "Anonymous",
          photoUrl: review.reviewer?.profilePhotoUrl,
        },
        rating: Number(review.starRating) || 5,
        text: truncateReviewText(review.comment || "", 500),
        date: review.createTime || new Date().toISOString(),
        relativeTimeDescription:
          review.relativePublishTimeDescription || "Recent",
      }));

      // Sort by date (newest first) and limit results
      const sortedReviews = transformedReviews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, this.config.maxReviews || 100);

      // Translating reviews natively using unstable_cache via Gemini
      let finalReviews = sortedReviews;
      if (locale !== "en" && finalReviews.length > 0) {
        const reviewsStr = JSON.stringify(finalReviews);
        finalReviews = await getTranslatedReviews(reviewsStr, locale);
      }

      return {
        reviews: finalReviews,
        totalCount,
        averageRating,
      };
    } catch (error) {
      console.error("Error fetching Google reviews:", error);

      // Return empty data if API fails to avoid showing hardcoded mock reviews
      return {
        reviews: [],
        totalCount: 0,
        averageRating: 0,
      };
    }
  }

  /**
   * Calculate aggregate rating from reviews
   */
  async getAggregateRating(): Promise<AggregateRating> {
    try {
      const { totalCount, averageRating } = await this.fetchGoogleReviews("en"); // Aggregate rating doesn't need translations

      if (totalCount === 0) {
        return {
          average: 0,
          count: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      // ALGORITHM: Calculate a realistic star distribution based on total count and average rating
      // Average: 4.8, Total: 71 -> Total Points: ~341. Max Points (all 5s): 355. Difference: 14.
      // This means approx 14 reviews are 4-star instead of 5-star.
      const totalPointsNeeded = Math.round(totalCount * averageRating);
      const diffFromMax = (totalCount * 5) - totalPointsNeeded;
      
      // Heuristic split: Mostly 4s, some 3s/2s if diff is large
      const distribution = {
        5: totalCount,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      if (diffFromMax > 0) {
        // Distribute the "lost" points starting from 4 stars
        let pointsToLose = diffFromMax;
        
        // 4 stars (costs 1 point each)
        distribution[4] = Math.min(Math.round(pointsToLose * 0.8), totalCount - 1);
        distribution[5] -= distribution[4];
        pointsToLose -= distribution[4];

        if (pointsToLose > 0) {
          // 3 stars (costs 2 points each)
          distribution[3] = Math.min(Math.round(pointsToLose / 2), distribution[5]);
          distribution[5] -= distribution[3];
          pointsToLose -= (distribution[3] * 2);
        }
        
        // Ensure total count matches
        const currentSum = distribution[5] + distribution[4] + distribution[3] + distribution[2] + distribution[1];
        if (currentSum < totalCount) distribution[5] += (totalCount - currentSum);
      }

      return {
        average: averageRating,
        count: totalCount,
        distribution,
      };
    } catch (error) {
      console.error("Error calculating aggregate rating:", error);
      return {
        average: 0,
        count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
  }


}

// Export singleton instance
export const reviewsService = new ReviewsService({
  apiKey: "", // Legacy, unused
  widgetId: "", // Legacy, falls back to settingsService 
  maxReviews: 100,
  sortBy: "newest",
});

export default ReviewsService;
