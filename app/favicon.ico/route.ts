import { type NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/lib/settings-service";

const SUPABASE_STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public`
  : "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public";

const TRANSPARENT_PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nCJ8xAAAAAAElFTkSuQmCC",
  "base64",
);

export async function GET(request: NextRequest) {
  try {
    const settings = await settingsService.getSettings();

    if (settings.favicon_url) {
      let targetUrl: string | null = null;
      if (settings.favicon_url.startsWith("/storage/")) {
        const rel = settings.favicon_url.slice("/storage/".length);
        if (!rel.includes("..")) {
          targetUrl = `${SUPABASE_STORAGE_BASE}/${rel}`;
        }
      } else {
        try {
          const base = settings.app_base_url || new URL(request.url).origin;
          const resolved = new URL(settings.favicon_url, base);
          if (resolved.protocol === "https:" || resolved.protocol === "http:") {
            targetUrl = resolved.toString();
          }
        } catch {
          targetUrl = null;
        }
      }

      if (targetUrl) {
        const res = await fetch(targetUrl);
        if (res.ok && res.body) {
          return new NextResponse(res.body, {
            status: 200,
            headers: {
              "Content-Type": res.headers.get("Content-Type") || "image/png",
              "Cache-Control": "public, max-age=86400",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
      }
    }
  } catch {
    // Fall back to transparent pixel rather than returning 404/500 to browsers/crawlers
  }

  return new NextResponse(TRANSPARENT_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
