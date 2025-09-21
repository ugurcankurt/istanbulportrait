import type {
  ISTANBUL_DESTINATION_ID,
  ISTANBUL_TOUR_CATEGORIES,
  ViatorAPIResponse,
  ViatorDestination,
  ViatorDestinationSearchRequest,
  ViatorProduct,
  ViatorSearchRequest,
  ViatorSearchResponse,
} from "@/types/viator";

export type { ISTANBUL_DESTINATION_ID, ISTANBUL_TOUR_CATEGORIES };

class ViatorAPI {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    // Force production API
    const isProduction = true; // Always use production

    // Use NEXT_PUBLIC_ prefixed variables for client-side access
    this.apiKey = isProduction
      ? process.env.NEXT_PUBLIC_VIATOR_API_KEY_PRODUCTION!
      : process.env.NEXT_PUBLIC_VIATOR_API_KEY_SANDBOX!;
    this.baseUrl = isProduction
      ? process.env.NEXT_PUBLIC_VIATOR_BASE_URL!
      : process.env.NEXT_PUBLIC_VIATOR_SANDBOX_URL!;

    // Validate required environment variables
    if (!this.apiKey) {
      throw new Error(
        `Missing Viator API key. Please check your environment variables.`,
      );
    }
    if (!this.baseUrl) {
      throw new Error(
        `Missing Viator base URL. Please check your environment variables.`,
      );
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    data?: object,
    locale?: string,
  ): Promise<ViatorAPIResponse<T>> {
    try {
      // Use our internal API proxy instead of direct Viator API calls
      const proxyEndpoint = this.getProxyEndpoint(endpoint);

      // For server-side requests, use absolute URL
      const baseUrl =
        typeof window === "undefined"
          ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          : "";
      const fullUrl = `${baseUrl}${proxyEndpoint}`;

      // Include locale and force EUR currency in request body
      const requestData = {
        ...data,
        locale: locale || "en",
        currency: "EUR",
      };

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(
          `API Proxy Error: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      return {
        success: result.success || false,
        data: result.data,
        errorMessage: result.errorMessage,
        errorReference: result.errorReference,
        vmid: result.vmid,
      };
    } catch (error) {
      // Viator API Request Failed
      return {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private getProxyEndpoint(viatorEndpoint: string): string {
    // Map Viator API endpoints to our proxy endpoints
    const endpointMap: Record<string, string> = {
      "/products/search": "/api/viator/search",
      "/taxonomy/destinations": "/api/viator/destinations",
    };

    const proxyEndpoint = endpointMap[viatorEndpoint];
    if (!proxyEndpoint) {
      throw new Error(`No proxy endpoint configured for: ${viatorEndpoint}`);
    }

    return proxyEndpoint;
  }

  /**
   * Get destinations (useful for navigation/filtering)
   */
  async getDestinations(
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorDestination[]>> {
    return this.makeRequest<ViatorDestination[]>(
      "/taxonomy/destinations",
      {},
      locale,
    );
  }

  /**
   * Search products for Istanbul specifically
   */
  async getIstanbulTours(
    params?: Partial<ViatorSearchRequest>,
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorProduct[]>> {
    // Use new API v2.0 format with filtering object
    const searchParams = {
      filtering: {
        destination: 585, // Istanbul destination ID
        ...(params?.categoryId && { categoryId: params.categoryId }),
        ...(params?.subcategoryId && { subcategoryId: params.subcategoryId }),
        ...(params?.startDate && { startDate: params.startDate }),
        ...(params?.endDate && { endDate: params.endDate }),
      },
      topX: params?.topX || 12,
      sortOrder: params?.sortOrder || "REVIEW_AVG_RATING_D",
      currency: "EUR", // Force EUR currency
      // Include other params that are not part of filtering
      ...Object.fromEntries(
        Object.entries(params || {}).filter(
          ([key]) =>
            ![
              "categoryId",
              "subcategoryId",
              "startDate",
              "endDate",
              "destId",
              "currencyCode",
            ].includes(key),
        ),
      ),
    };

    const response = await this.makeRequest<any>(
      "/products/search",
      searchParams,
      locale,
    );

    if (response.success && response.data?.products) {
      return {
        ...response,
        data: response.data.products,
      };
    }

    // Return proper error response for failed cases
    return {
      success: false,
      data: undefined,
      errorMessage: response.errorMessage || "Failed to fetch tours",
      errorReference: response.errorReference,
      vmid: response.vmid,
    };
  }

  /**
   * Get featured/popular Istanbul tours
   */
  async getFeaturedIstanbulTours(
    limit: number = 6,
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorProduct[]>> {
    return this.getIstanbulTours(
      {
        topX: limit,
        sortOrder: "REVIEW_AVG_RATING_D",
      },
      locale,
    );
  }

  /**
   * Get multiple pages of tours using pagination
   */
  async getMultiplePages(
    pages: number,
    pageSize: number = 50,
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorProduct[]>> {
    try {
      const pagePromises = [];

      // Create promises for multiple pages (Viator API uses 1-based indexing for 'start')
      for (let page = 0; page < pages; page++) {
        const start = page * pageSize + 1; // Viator API uses 1-based start indexing
        pagePromises.push(
          this.getIstanbulTours(
            {
              topX: pageSize,
              start: start,
              sortOrder: "REVIEW_AVG_RATING_D",
            },
            locale,
          ),
        );
      }

      // Execute all page requests in parallel
      const pageResponses = await Promise.all(pagePromises);

      // Combine all tours from different pages
      const allTours: ViatorProduct[] = [];
      pageResponses.forEach((response, index) => {
        if (response.success && response.data) {
          allTours.push(...response.data);
        }
      });

      // Remove duplicates based on productCode
      const uniqueTours = allTours.reduce((acc: ViatorProduct[], tour) => {
        if (
          !acc.find((existing) => existing.productCode === tour.productCode)
        ) {
          acc.push(tour);
        }
        return acc;
      }, []);

      return {
        success: true,
        data: uniqueTours,
      };
    } catch (error) {
      // Error fetching multiple pages
      return {
        success: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to fetch multiple pages",
      };
    }
  }

  /**
   * Get ALL Istanbul tours by using multiple search strategies (pagination doesn't work with Basic API)
   */
  async getAllIstanbulTours(
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorProduct[]>> {
    try {
      // Strategy 1: Different sorting methods (each returns 10 tours)
      const sortingPromises = [
        this.getIstanbulTours(
          {
            topX: 50, // API will still return max 10
            sortOrder: "REVIEW_AVG_RATING_D",
          },
          locale,
        ),
        this.getIstanbulTours(
          {
            topX: 50,
            sortOrder: "PRICE_FROM_A", // Cheapest first
          },
          locale,
        ),
        this.getIstanbulTours(
          {
            topX: 50,
            sortOrder: "PRICE", // Most expensive first
          },
          locale,
        ),
        this.getIstanbulTours(
          {
            topX: 50,
            sortOrder: "REVIEW_AVG_RATING_A", // Lowest rated first
          },
          locale,
        ),
      ];

      const sortingResponses = await Promise.all(sortingPromises);

      // Combine all tours with detailed logging
      const allTours: ViatorProduct[] = [];

      // Add tours from different sorting strategies
      const sortingLabels = [
        "Best Rated",
        "Cheapest",
        "Most Expensive",
        "Lowest Rated",
      ];
      sortingResponses.forEach((response, index) => {
        if (response.success && response.data) {
          allTours.push(...response.data);
        } else {
          // Strategy failed
        }
      });

      // Remove duplicates based on productCode
      const uniqueTours = allTours.reduce((acc: ViatorProduct[], tour) => {
        if (
          !acc.find((existing) => existing.productCode === tour.productCode)
        ) {
          acc.push(tour);
        }
        return acc;
      }, []);

      // Sort by rating (best first)
      uniqueTours.sort(
        (a, b) =>
          b.reviews.combinedAverageRating - a.reviews.combinedAverageRating,
      );

      // Note: Viator Partner Basic API doesn't support pagination or more than 10 results per request
      // We use multiple sorting strategies to get diverse results and maximize variety

      return {
        success: true,
        data: uniqueTours,
      };
    } catch (error) {
      // Error fetching all Istanbul tours
      return {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : "Failed to fetch all tours",
      };
    }
  }

  /**
   * Get tours by category
   */
  async getIstanbulToursByCategory(
    categoryId: number,
    limit: number = 12,
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorProduct[]>> {
    return this.getIstanbulTours(
      {
        categoryId,
        topX: limit,
        sortOrder: "REVIEW_AVG_RATING_D",
      },
      locale,
    );
  }

  /**
   * Get historical tours (most relevant to photography)
   */
  async getHistoricalTours(
    limit: number = 8,
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorProduct[]>> {
    return this.getIstanbulToursByCategory(1, limit, locale); // Category 1 is typically historical/cultural
  }

  /**
   * Get photography-friendly tours
   */
  async getPhotographyTours(
    limit: number = 8,
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorProduct[]>> {
    return this.getIstanbulTours(
      {
        topX: limit,
        sortOrder: "REVIEW_AVG_RATING_D",
        // Filter for tours that mention photography, scenic views, etc.
      },
      locale,
    );
  }

  /**
   * Build Viator booking URL for affiliate redirect
   */
  buildBookingUrl(product: ViatorProduct, locale: string = "en"): string {
    // Use the productUrl from the API response directly
    const url = new URL(product.productUrl);

    // Add/update affiliate parameters from environment variables
    const partnerId =
      process.env.VIATOR_PARTNER_ID ||
      process.env.NEXT_PUBLIC_VIATOR_PARTNER_ID ||
      "P00238027";
    const campaignId =
      process.env.VIATOR_CAMPAIGN_ID ||
      process.env.NEXT_PUBLIC_VIATOR_CAMPAIGN_ID ||
      "istanbulportrait";

    url.searchParams.set("pid", partnerId);
    url.searchParams.set("mcid", campaignId);

    // Add locale for better tracking if supported by Viator
    if (locale !== "en") {
      url.searchParams.set("locale", locale);
    }

    return url.toString();
  }

  /**
   * Generate cross-sell recommendations based on photography packages
   */
  async getCrossSellTours(
    packageType: "essential" | "premium" | "luxury",
    locale?: string,
  ): Promise<ViatorAPIResponse<ViatorProduct[]>> {
    const categoryMap = {
      essential: 1, // Historical/cultural tours
      premium: 4, // Cruises/boat tours
      luxury: 7, // Private tours
    };

    return this.getIstanbulToursByCategory(categoryMap[packageType], 4, locale);
  }
}

// Export singleton instance
export const viatorAPI = new ViatorAPI();

// Helper functions for common use cases
export async function getPopularIstanbulTours(
  limit: number = 6,
  locale?: string,
) {
  return viatorAPI.getFeaturedIstanbulTours(limit, locale);
}

export async function getAllIstanbulTours(locale?: string) {
  return viatorAPI.getAllIstanbulTours(locale);
}

export async function getToursForPhotography(
  limit: number = 8,
  locale?: string,
) {
  return viatorAPI.getPhotographyTours(limit, locale);
}

export async function getTourRecommendations(
  packageType: "essential" | "premium" | "luxury",
  locale?: string,
) {
  return viatorAPI.getCrossSellTours(packageType, locale);
}

// Cache for frequently accessed data (in memory for now, could be Redis in production)
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export async function getCachedTours<T>(
  key: string,
  fetcher: () => Promise<ViatorAPIResponse<T>>,
  ttlMinutes: number = 60,
): Promise<ViatorAPIResponse<T>> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < cached.ttl * 60 * 1000) {
    return cached.data;
  }

  const result = await fetcher();

  if (result.success) {
    cache.set(key, {
      data: result,
      timestamp: now,
      ttl: ttlMinutes,
    });
  }

  return result;
}

// Utility function to format tour duration
export function formatDuration(duration: string): string {
  // Handle various duration formats from Viator API
  if (duration.includes("hour")) {
    return duration;
  }
  if (duration.includes("day")) {
    return duration;
  }
  // Add more formatting as needed
  return duration;
}

// Utility function to format price
export function formatTourPrice(
  price: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  }).format(price);
}
