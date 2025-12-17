import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  deleteBlogPost,
  getBlogPostByIdWithAllTranslations,
  updateBlogPost,
} from "@/lib/blog/blog-service";
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
import { blogUpdateSchema } from "@/lib/validations/blog-validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
        endpoint: "admin-blog-get",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const { id } = await params;
    const post = await getBlogPostByIdWithAllTranslations(id);

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    logError(error, {
      endpoint: "admin-blog-get",
      duration,
      action: "unexpected_error",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();

  try {
    const ip = getClientIP(request);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimitResult.success) {
      logError(new Error("Rate limit exceeded"), {
        ip,
        endpoint: "admin-blog-update",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();

    // Validate request body
    const validationResult = blogUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      const validationError = new ValidationError("Invalid request data");
      logError(validationError, {
        ip,
        endpoint: "admin-blog-update",
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
      const { id } = await params;
      const post = await updateBlogPost(id, validationResult.data);

      if (!post) {
        return NextResponse.json(
          { error: "Blog post not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        post,
      });
    } catch (supabaseError: unknown) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        ip,
        endpoint: "admin-blog-update",
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
      endpoint: "admin-blog-update",
      duration,
      action: "unexpected_error",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
        endpoint: "admin-blog-delete",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    try {
      const { id } = await params;
      const success = await deleteBlogPost(id);

      if (!success) {
        return NextResponse.json(
          { error: "Failed to delete blog post" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Blog post deleted successfully",
      });
    } catch (supabaseError: unknown) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        ip,
        endpoint: "admin-blog-delete",
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
      endpoint: "admin-blog-delete",
      duration,
      action: "unexpected_error",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}
