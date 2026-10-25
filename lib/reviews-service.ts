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
  if (lastSpace === -1) return `${truncated}...`;

  // Return text up to last complete word
  const result = truncated.substring(0, lastSpace);

  // Add ellipsis if we actually truncated
  return result + (text.length > lastSpace ? "..." : "");
}

/**
 * Internal helper to translate a single review using Gemini (primary) with fallback to NVIDIA AI.
 */
export async function translateReviewWithAI(
  text: string,
  locale: string,
): Promise<string> {
  const supportedLocales = ["ar", "ru", "es", "zh", "fr", "de", "ro", "tr"];
  if (!supportedLocales.includes(locale) || !text || text.trim() === "") {
    return text;
  }

  const prompt = `You are a professional localization expert. Translate the following customer review into language code "${locale}". Maintain the original positive and natural tone. Return ONLY the translation, with no explanation or extra quotes:\n\n${text}`;

  // 1. Try Google Gemini API if key is available
  try {
    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();
    const geminiKey = settings.gemini_api_key || process.env.GEMINI_API_KEY;

    if (geminiKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const geminiUrl =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiKey.trim(),
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 250,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (output) {
          return output.replace(/^["']|["']$/g, "").trim();
        }
      }
    }
  } catch (_e) {
    // Failover to secondary provider
  }

  // 2. High-performance Fallback: NVIDIA AI API
  try {
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (nvidiaKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${nvidiaKey.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta/llama-3.2-11b-vision-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            max_tokens: 250,
          }),
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const output = data.choices?.[0]?.message?.content?.trim();
        if (output) {
          return output.replace(/^["']|["']$/g, "").trim();
        }
      }
    }
  } catch (_e) {
    // Return original text if both AI providers fail
  }

  return text;
}

// In-memory cache for fast access within the active Node process
const inMemoryReviewTranslations: Record<string, Record<string, string>> = {};

/**
 * Load persisted review translations from the Supabase "pages" table (slug: "home-reviews")
 */
async function loadPersistedTranslations(): Promise<
  Record<string, Record<string, string>>
> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return inMemoryReviewTranslations;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("pages")
      .select("content")
      .eq("slug", "home-reviews")
      .single();

    const dbTranslations =
      (data?.content?.review_translations as Record<
        string,
        Record<string, string>
      >) || {};

    // Synchronize to in-memory cache
    for (const [reviewId, locMap] of Object.entries(dbTranslations)) {
      if (!inMemoryReviewTranslations[reviewId]) {
        inMemoryReviewTranslations[reviewId] = {};
      }
      Object.assign(inMemoryReviewTranslations[reviewId], locMap);
    }

    return inMemoryReviewTranslations;
  } catch (err) {
    console.error("Failed to load persisted review translations:", err);
    return inMemoryReviewTranslations;
  }
}

/**
 * Persist newly translated reviews into Supabase so they are permanently cached
 */
async function persistTranslationsToDb(
  newTranslations: Record<string, Record<string, string>>,
): Promise<void> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: pageData } = await supabase
      .from("pages")
      .select("id, content")
      .eq("slug", "home-reviews")
      .single();

    if (!pageData) return;

    const currentContent = pageData.content || {};
    const existingTranslations =
      (currentContent.review_translations as Record<
        string,
        Record<string, string>
      >) || {};

    let hasChanges = false;
    for (const [id, locMap] of Object.entries(newTranslations)) {
      if (!existingTranslations[id]) {
        existingTranslations[id] = {};
      }
      for (const [loc, text] of Object.entries(locMap)) {
        if (existingTranslations[id][loc] !== text) {
          existingTranslations[id][loc] = text;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      await supabase
        .from("pages")
        .update({
          content: {
            ...currentContent,
            review_translations: existingTranslations,
          },
        })
        .eq("id", pageData.id);
    }
  } catch (err) {
    console.error("Failed to persist review translations to DB:", err);
  }
}

class ReviewsService {
  private config: ReviewsServiceConfig;

  constructor(config: ReviewsServiceConfig) {
    this.config = config;
  }

  /**
   * Internal direct fetch from Featurable and translation logic
   */
  async fetchGoogleReviewsDirect(locale: string = "en"): Promise<{
    reviews: GoogleReview[];
    totalCount: number;
    averageRating: number;
  }> {
    try {
      // 1. Fetch dynamic configuration from CMS
      const { pagesContentService } = await import(
        "@/lib/pages-content-service"
      );
      const pageData = await pagesContentService.getPageBySlug("home-reviews");
      const rawInput = pageData?.content?.featurable_code || "";

      // 2. Safely extract the UUID from the raw configuration
      const uuidRegex =
        /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
      const match = rawInput.match(uuidRegex);

      let activeWidgetId = match ? match[0] : null;

      // 3. Fallback to .env config if CMS is unconfigured
      if (!activeWidgetId) {
        const { settingsService } = await import("@/lib/settings-service");
        const settings = await settingsService.getSettings();
        activeWidgetId = settings.featurable_widget_id || this.config.widgetId;
      }

      if (!activeWidgetId) {
        console.warn(
          "ReviewsService: No Featurable Widget ID configured. Returning empty reviews gracefully.",
        );
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
          // Cache Featurable response for 7 days to minimize external latency
          next: { revalidate: 604800, tags: ["reviews"] },
        },
      );

      if (!response.ok) {
        throw new Error(`Featurable API error: ${response.status}`);
      }

      const data = await response.json();

      // Featurable API response structure adaptation
      interface RawFeaturableReview {
        reviewId?: string;
        id?: string;
        reviewer?: { displayName?: string; profilePhotoUrl?: string };
        starRating?: number | string;
        comment?: string;
        createTime?: string;
        relativePublishTimeDescription?: string;
      }
      const reviews: RawFeaturableReview[] = data.reviews || [];
      const totalCount = Number(data.totalReviewCount) || reviews.length;
      const averageRatingRaw = Number(data.averageRating) || 5;
      const averageRating = Math.round(averageRatingRaw * 10) / 10;

      // Transform to our GoogleReview interface with stable ID
      const transformedReviews: GoogleReview[] = reviews.map(
        (review: RawFeaturableReview, index: number) => {
          const rawId =
            review.reviewId ||
            review.id ||
            `review-${review.reviewer?.displayName || "anon"}-${review.createTime || index}`;
          return {
            id: String(rawId),
            author: {
              name: review.reviewer?.displayName || "Anonymous",
              photoUrl: review.reviewer?.profilePhotoUrl,
            },
            rating: Number(review.starRating) || 5,
            text: truncateReviewText(review.comment || "", 500),
            date: review.createTime || new Date().toISOString(),
            relativeTimeDescription:
              review.relativePublishTimeDescription || "Recent",
          };
        },
      );

      // Sort by date (newest first) and limit results
      const sortedReviews = transformedReviews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, this.config.maxReviews || 100);

      // If locale is English, no translation needed
      if (locale === "en") {
        return {
          reviews: sortedReviews,
          totalCount,
          averageRating,
        };
      }

      // Load existing translations from DB & memory
      const allCachedTranslations = await loadPersistedTranslations();
      const newlyTranslatedMap: Record<string, Record<string, string>> = {};

      // Translate all reviews for the requested locale
      const finalReviews = await Promise.all(
        sortedReviews.map(async (review) => {
          if (!review.text || review.text.trim() === "") return review;

          // 1. Check if translation exists in permanent cache
          const cached =
            allCachedTranslations[review.id]?.[locale] ||
            inMemoryReviewTranslations[review.id]?.[locale];

          if (cached) {
            return { ...review, text: cached };
          }

          // 2. Not cached yet: translate with AI once
          try {
            const translatedText = await translateReviewWithAI(
              review.text,
              locale,
            );

            if (translatedText && translatedText !== review.text) {
              if (!inMemoryReviewTranslations[review.id]) {
                inMemoryReviewTranslations[review.id] = {};
              }
              inMemoryReviewTranslations[review.id][locale] = translatedText;

              if (!newlyTranslatedMap[review.id]) {
                newlyTranslatedMap[review.id] = {};
              }
              newlyTranslatedMap[review.id][locale] = translatedText;

              return { ...review, text: translatedText };
            }
          } catch (e) {
            console.error(
              `Failed to translate review ${review.id} for locale ${locale}:`,
              e,
            );
          }

          return review;
        }),
      );

      // Persist any newly translated reviews asynchronously to Supabase
      if (Object.keys(newlyTranslatedMap).length > 0) {
        persistTranslationsToDb(newlyTranslatedMap).catch((err) =>
          console.error("Async DB persist error for reviews:", err),
        );
      }

      return {
        reviews: finalReviews,
        totalCount,
        averageRating,
      };
    } catch (error) {
      console.error("Error fetching Google reviews:", error);

      return {
        reviews: [],
        totalCount: 0,
        averageRating: 0,
      };
    }
  }

  /**
   * Cached fetch for Google reviews per locale with 24h Next.js cache + permanent DB translation store
   */
  async fetchGoogleReviews(locale: string = "en"): Promise<{
    reviews: GoogleReview[];
    totalCount: number;
    averageRating: number;
  }> {
    return unstable_cache(
      async () => this.fetchGoogleReviewsDirect(locale),
      [`google-reviews-v2-${locale}`],
      { revalidate: 86400, tags: ["reviews", `reviews-${locale}`] },
    )();
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
      const diffFromMax = totalCount * 5 - totalPointsNeeded;

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
        distribution[4] = Math.min(
          Math.round(pointsToLose * 0.8),
          totalCount - 1,
        );
        distribution[5] -= distribution[4];
        pointsToLose -= distribution[4];

        if (pointsToLose > 0) {
          // 3 stars (costs 2 points each)
          distribution[3] = Math.min(
            Math.round(pointsToLose / 2),
            distribution[5],
          );
          distribution[5] -= distribution[3];
          pointsToLose -= distribution[3] * 2;
        }

        // Ensure total count matches
        const currentSum =
          distribution[5] +
          distribution[4] +
          distribution[3] +
          distribution[2] +
          distribution[1];
        if (currentSum < totalCount) distribution[5] += totalCount - currentSum;
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
