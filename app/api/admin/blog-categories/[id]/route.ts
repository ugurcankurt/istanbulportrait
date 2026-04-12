import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  deleteBlogCategory,
  getCategoryByIdWithAllTranslations,
  updateBlogCategory,
} from "@/lib/blog/blog-service";
import { logError, sanitizeErrorForProduction } from "@/lib/errors";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { categoryUpdateSchema } from "@/lib/validations/blog-validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ip = getClientIP(request);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 60,
    });

    if (!rateLimitResult.success) {
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const { id } = await params;
    const category = await getCategoryByIdWithAllTranslations(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    logError(error, { endpoint: "admin-blog-category-get" });
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
  try {
    const ip = getClientIP(request);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimitResult.success) {
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();

    const validationResult = categoryUpdateSchema.safeParse(body);
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

    const { id } = await params;
    const category = await updateBlogCategory(id, validationResult.data);

    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    logError(error, { endpoint: "admin-blog-category-update" });
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
  try {
    const ip = getClientIP(request);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimitResult.success) {
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const { id } = await params;
    await deleteBlogCategory(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logError(error, { endpoint: "admin-blog-category-delete" });
    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: 500 },
    );
  }
}
