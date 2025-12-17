import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createBlogPost, getAllBlogPosts } from "@/lib/blog/blog-service";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { blogFormSchema } from "@/lib/validations/blog-validations";
import type { BlogQueryParams } from "@/types/blog";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const ip = getClientIP(request);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 60,
    });

    if (!rateLimitResult.success) {
      logError(new Error("Rate limit exceeded"), {
        ip,
        endpoint: "admin-blog-list",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params = {
      page: Number.parseInt(searchParams.get("page") || "1", 10),
      limit: Number.parseInt(searchParams.get("limit") || "20", 10),
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "all",
      category_id: searchParams.get("category_id") || undefined,
      tag_id: searchParams.get("tag_id") || undefined,
      locale: searchParams.get("locale") || "en",
      is_featured:
        searchParams.get("is_featured") === "true" ? true : undefined,
      sort_by: searchParams.get("sort_by") || "created_at",
      sort_order: (searchParams.get("sort_order") || "desc") as "asc" | "desc",
    };

    const result = await getAllBlogPosts(params as BlogQueryParams);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logError(error, {
      endpoint: "admin-blog-list",
      duration,
      action: "unexpected_error",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const ip = getClientIP(request);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimitResult.success) {
      logError(new Error("Rate limit exceeded"), {
        ip,
        endpoint: "admin-blog-create",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();

    // Validate request body
    const validationResult = blogFormSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = new ValidationError("Invalid request data");
      logError(validationError, {
        ip,
        endpoint: "admin-blog-create",
        validationIssues: validationResult.error.issues,
      });

      return NextResponse.json(
        {
          error: sanitizeErrorForProduction(validationError),
          details:
            process.env.NODE_ENV === "development"
              ? validationResult.error.issues
              : undefined,
        },
        { status: 400 },
      );
    }

    try {
      const post = await createBlogPost(validationResult.data);

      return NextResponse.json({
        success: true,
        post,
      });
    } catch (supabaseError: unknown) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        ip,
        endpoint: "admin-blog-create",
        action: "database_operation",
      });

      return NextResponse.json(
        {
          error: sanitizeErrorForProduction(dbError),
          details:
            process.env.NODE_ENV === "development"
              ? handleSupabaseError(supabaseError).message
              : undefined,
        },
        { status: 503 },
      );
    }
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logError(error, {
      endpoint: "admin-blog-create",
      duration,
      action: "unexpected_error",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}
