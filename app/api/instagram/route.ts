import { NextResponse } from "next/server";
import { pagesContentService } from "@/lib/pages-content-service";
import { settingsService } from "@/lib/settings-service";

export const revalidate = 3600; // Cache for 1 hour to prevent Behold.so rate-limiting

export async function GET() {
  try {
    // 1. Fetch the home-instagram page configuration and site settings in parallel
    const [pageData, settings] = await Promise.all([
      pagesContentService.getPageBySlug("home-instagram"),
      settingsService.getSettings(),
    ]);

    // 2. Extract the dynamically configured behold_url (prefer CMS page, fallback to Site Settings)
    const beholdUrl =
      pageData?.content?.behold_url || settings?.behold_url || null;

    if (!beholdUrl || typeof beholdUrl !== "string") {
      // Return graceful empty state if the Administrator hasn't configured a feed yet
      return NextResponse.json({
        username: "istanbulportrait",
        biography: "Instagram Feed Not Configured",
        profilePictureUrl: "",
        website: "",
        posts: [],
      });
    }

    // 3. Native fetch to the live Behold API
    const res = await fetch(beholdUrl, {
      next: { revalidate: 3600 }, // Parallel NextJS caching
    });

    if (!res.ok) {
      throw new Error(`Behold API responded with status: ${res.status}`);
    }

    const liveData = await res.json();
    return NextResponse.json(liveData);
  } catch (error: any) {
    console.error("Dynamic Instagram Server Error:", error);
    return NextResponse.json(
      { error: "Failed to load live Instagram feed" },
      { status: 500 },
    );
  }
}
