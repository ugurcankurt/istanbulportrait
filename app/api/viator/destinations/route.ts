import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();

    // Extract locale from request body
    const locale = body.locale || "en";

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
        ar: "en-US", // Fallback to English for Arabic
        ru: "en-US", // Fallback to English for Russian
      };
      return localeMap[locale] || "en-US";
    };

    // Make request to Viator destinations API
    const viatorResponse = await fetch(`${baseUrl}/taxonomy/destinations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json;version=2.0",
        "Accept-Language": getAcceptLanguage(locale),
        "exp-api-key": apiKey,
      },
    });

    if (!viatorResponse.ok) {
      const errorText = await viatorResponse.text();
      if (process.env.NODE_ENV === "development") {
        console.error(
          "Viator Destinations API Error:",
          viatorResponse.status,
          viatorResponse.statusText,
          errorText,
        );
      }
      return NextResponse.json(
        {
          success: false,
          errorMessage: `Viator Destinations API Error: ${viatorResponse.status} ${viatorResponse.statusText}`,
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
      console.error("Viator Destinations API Proxy Error:", error);
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
    {
      message:
        "Viator Destinations API proxy endpoint. Use POST method to get destinations.",
    },
    { status: 200 },
  );
}
