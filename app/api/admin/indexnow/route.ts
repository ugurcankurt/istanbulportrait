import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { getServerUser, isServerAdmin } from "@/lib/auth-server";
import { submitToIndexNow } from "@/lib/indexnow";

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user || !(await isServerAdmin(user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    let urls: string[] = body.urls || [];

    // If no specific URLs provided, generate all 9 language homepages and core routes
    if (urls.length === 0) {
      urls = routing.locales.map((loc) => `/${loc}`);
    }

    const result = await submitToIndexNow(urls);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
