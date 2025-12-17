import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    // Validate environment variables
    const apiKey = process.env.INDEXNOW_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "IndexNow API key not configured" },
        { status: 500 },
      );
    }

    // Validate input
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "URLs array is required" },
        { status: 400 },
      );
    }

    // Limit to 10,000 URLs as per IndexNow spec
    if (urls.length > 10000) {
      return NextResponse.json(
        { error: "Maximum 10,000 URLs allowed per request" },
        { status: 400 },
      );
    }

    // Prepare IndexNow payload
    const payload = {
      host: "istanbulportrait.com",
      key: apiKey,
      keyLocation: `https://istanbulportrait.com/${apiKey}.txt`,
      urlList: urls,
    };

    // Submit to IndexNow
    const indexNowResponse = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Istanbul-Photographer-Website/1.0",
      },
      body: JSON.stringify(payload),
    });

    // Handle IndexNow response
    if (indexNowResponse.status === 200) {
      return NextResponse.json({
        success: true,
        message: `Successfully submitted ${urls.length} URLs to IndexNow`,
        submittedUrls: urls.length,
      });
    } else if (indexNowResponse.status === 202) {
      return NextResponse.json({
        success: true,
        message: `IndexNow accepted ${urls.length} URLs for processing`,
        submittedUrls: urls.length,
      });
    } else {
      const errorText = await indexNowResponse.text();
      // IndexNow submission failed

      return NextResponse.json(
        {
          success: false,
          error: "IndexNow submission failed",
          details:
            process.env.NODE_ENV === "development" ? errorText : undefined,
        },
        { status: indexNowResponse.status },
      );
    }
  } catch (error) {
    // IndexNow API error

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}

// GET endpoint for health check
export async function GET() {
  const apiKey = process.env.INDEXNOW_API_KEY;

  return NextResponse.json({
    status: "IndexNow API endpoint active",
    configured: !!apiKey,
    keyFile: apiKey
      ? `https://istanbulportrait.com/${apiKey}.txt`
      : "Not configured",
  });
}
