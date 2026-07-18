import { NextResponse } from "next/server";
import { settingsService } from "@/lib/settings-service";

export async function GET() {
  try {
    const settings = await settingsService.getSettings();
    
    if (settings.favicon_url) {
      return NextResponse.redirect(settings.favicon_url, 302);
    }

    // Fallback transparent 1x1 PNG (base64) to prevent 404 errors in browser consoles
    const transparentPixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nCJ8xAAAAAAElFTkSuQmCC",
      "base64"
    );

    return new NextResponse(transparentPixel, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return new NextResponse("Not Found", { status: 404 });
  }
}
