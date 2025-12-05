import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createBlogTag, getBlogTags } from "@/lib/blog/blog-service";
import { logError, sanitizeErrorForProduction } from "@/lib/errors";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { tagFormSchema } from "@/lib/validations/blog-validations";
import type { Locale } from "@/types/blog";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 60,
    });

    if (!rateLimitResult.success) {
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";

    const result = await getBlogTags(locale as Locale);

    return NextResponse.json(result);
  } catch (error: unknown) {
    logError(error, { endpoint: "admin-blog-tags-list" });
    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimitResult.success) {
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();

    const validationResult = tagFormSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details:
            process.env.NODE_ENV === "development"
              ? validationResult.error.issues
              : undefined,
        },
        { status: 400 },
      );
    }

    const tag = await createBlogTag(validationResult.data);

    return NextResponse.json({ success: true, tag });
  } catch (error: unknown) {
    logError(error, { endpoint: "admin-blog-tags-create" });
    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}
