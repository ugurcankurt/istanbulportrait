import { type NextRequest, NextResponse } from "next/server";
import { getServerUser, isServerAdmin } from "@/lib/auth-server";
import { verifyDriveToken } from "@/lib/booking-token";

export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");
    const bookingId = searchParams.get("bookingId");
    const token = searchParams.get("token");

    if (!url) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== "lh3.googleusercontent.com"
    ) {
      return new NextResponse("Invalid URL", { status: 400 });
    }

    const hasValidToken =
      bookingId !== null &&
      token !== null &&
      verifyDriveToken(user.id, bookingId, url, token);

    if (!hasValidToken && !(await isServerAdmin(user.email))) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const response = await fetch(parsedUrl.toString());
    if (!response.ok) {
      return new NextResponse("Failed to fetch image", {
        status: response.status,
      });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
