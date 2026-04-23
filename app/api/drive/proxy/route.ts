import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url || !url.startsWith("https://lh3.googleusercontent.com/")) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: response.status });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
