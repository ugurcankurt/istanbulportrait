import { type NextRequest, NextResponse } from "next/server";
import { ISTANBUL_DESTINATION_ID } from "@/types/viator";

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();

    // Extract locale and currency from request body
    const locale = body.locale || "en";
    const currency = body.currency || "EUR"; // Force EUR as default

    // Force production API
    const isProduction = true; // Always use production
    const apiKey = isProduction
      ? process.env.VIATOR_API_KEY_PRODUCTION!
      : process.env.VIATOR_API_KEY_SANDBOX!;
    const baseUrl = isProduction
      ? process.env.VIATOR_BASE_URL!
      : process.env.VIATOR_SANDBOX_URL!;

    // Validate environment variables
    if (!apiKey || !baseUrl) {
      return NextResponse.json(
        {
          success: false,
          errorMessage: "Server configuration error: Missing API credentials",
        },
        { status: 500 },
      );
    }

    // Map locale to Accept-Language header format
    const getAcceptLanguage = (locale: string): string => {
      const localeMap: Record<string, string> = {
        en: "en-US",
        es: "es-ES",
        ar: "en-US", // Fallback to English for Arabic (not supported by Viator)
        ru: "en-US", // Fallback to English for Russian (not supported by Viator)
      };
      return localeMap[locale] || "en-US";
    };

    // Use only new Viator API v2.0 format with filtering object
    const searchParams = {
      filtering: {
        destination:
          body.destId || body.filtering?.destination || ISTANBUL_DESTINATION_ID,
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.subcategoryId && { subcategoryId: body.subcategoryId }),
        ...(body.startDate && { startDate: body.startDate }),
        ...(body.endDate && { endDate: body.endDate }),
        ...body.filtering,
      },
      topX: body.topX || 12,
      sortOrder: body.sortOrder || "REVIEW_AVG_RATING_D",
      currency: currency,
      // Add pagination support (Viator API uses 'start' parameter)
      ...(body.start && { start: body.start }),
      // Remove legacy fields that are now in filtering
      ...Object.fromEntries(
        Object.entries(body).filter(
          ([key]) =>
            ![
              "destId",
              "categoryId",
              "subcategoryId",
              "startDate",
              "endDate",
              "filtering",
              "locale",
              "currency",
              "start",
            ].includes(key),
        ),
      ),
    };

    // Make request to Viator API
    const viatorResponse = await fetch(`${baseUrl}/products/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json;version=2.0",
        "Accept-Language": getAcceptLanguage(locale),
        "exp-api-key": apiKey,
      },
      body: JSON.stringify(searchParams),
    });

    if (!viatorResponse.ok) {
      const errorText = await viatorResponse.text();
      if (process.env.NODE_ENV === "development") {
        console.error("🚨 Viator API Error:", {
          status: viatorResponse.status,
          statusText: viatorResponse.statusText,
          errorText,
          requestParams: searchParams,
          apiUrl: `${baseUrl}/products/search`,
        });
      }
      return NextResponse.json(
        {
          success: false,
          errorMessage: `Viator API Error: ${viatorResponse.status} ${viatorResponse.statusText}`,
          errorDetails: errorText,
        },
        { status: viatorResponse.status },
      );
    }

    const data = await viatorResponse.json();

    // Return successful response
    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Viator API Proxy Error:", error);
    }
    return NextResponse.json(
      {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Viator API proxy endpoint. Use POST method to search tours." },
    { status: 200 },
  );
}
