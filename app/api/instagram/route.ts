import { NextResponse } from "next/server";
import { pagesContentService } from "@/lib/pages-content-service";

export const revalidate = 3600; // Cache for 1 hour to prevent Behold.so rate-limiting

export async function GET() {
  try {
    // 1. Fetch the home-instagram page configuration from Supabase
    const pageData = await pagesContentService.getPageBySlug("home-instagram");
    
    // 2. Extract the dynamically configured behold_url
    const beholdUrl = pageData?.content?.behold_url;

    if (!beholdUrl || typeof beholdUrl !== "string") {
      // Return graceful empty state if the Administrator hasn't configured a feed yet
      return NextResponse.json({
        username: "360istanbul",
        biography: "Instagram Feed Not Configured",
        profilePictureUrl: "",
        website: "",
        posts: []
      });
    }

    // 3. Native fetch to the live Behold API
    const res = await fetch(beholdUrl, {
      next: { revalidate: 3600 } // Parallel NextJS caching
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
      { status: 500 }
    );
  }
}
