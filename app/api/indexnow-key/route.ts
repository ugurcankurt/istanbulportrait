import { type NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/lib/settings-service";

export async function GET(request: NextRequest) {
  const requestedKey = request.nextUrl.searchParams.get("key")?.trim();
  if (!requestedKey) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const settings = await settingsService.getSettings();
  const configuredKey =
    settings.indexnow_api_key?.trim() || process.env.INDEXNOW_API_KEY?.trim();

  if (!configuredKey || requestedKey !== configuredKey) {
    return new NextResponse("Not Found", { status: 404 });
  }

  return new NextResponse(configuredKey, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
