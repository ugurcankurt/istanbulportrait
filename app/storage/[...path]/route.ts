import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_STORAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public`
  : "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public";

function buildSafeStoragePath(segments: string[]): string | null {
  const safeSegments: string[] = [];
  for (const seg of segments) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(seg);
    } catch {
      return null;
    }
    if (
      !decoded ||
      decoded === "." ||
      decoded === ".." ||
      decoded.includes("/") ||
      decoded.includes("\\") ||
      decoded.includes("\0")
    ) {
      return null;
    }
    safeSegments.push(encodeURIComponent(decoded));
  }
  return safeSegments.join("/");
}

/**
 * Storage Edge Proxy
 *
 * Proxies public assets from Supabase Storage while fixing the critical SEO issue
 * where Supabase default-injects "x-robots-tag: none" which blocks Googlebot-Image
 * from indexing all images and showing them in SERP thumbnails and rich snippets.
 */
async function proxyStorageRequest(
  request: NextRequest,
  path: string[] | undefined,
  method: "GET" | "HEAD",
) {
  if (!path || path.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const storagePath = buildSafeStoragePath(path);
  if (!storagePath) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  const targetUrl = `${SUPABASE_STORAGE_BASE}/${storagePath}`;

  // Forward conditional request headers for cache validation
  const forwardHeaders: Record<string, string> = {};
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch) forwardHeaders["if-none-match"] = ifNoneMatch;
  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) forwardHeaders["if-modified-since"] = ifModifiedSince;
  const range = request.headers.get("range");
  if (range) forwardHeaders.range = range;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
    });

    if (upstreamRes.status === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Robots-Tag": "all, max-image-preview:large",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return new NextResponse(null, { status: upstreamRes.status });
    }

    const headers = new Headers();

    // Preserve media types and stream properties
    const contentType = upstreamRes.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);

    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);

    const acceptRanges = upstreamRes.headers.get("accept-ranges");
    if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

    const etag = upstreamRes.headers.get("etag");
    if (etag) headers.set("ETag", etag);

    const lastModified = upstreamRes.headers.get("last-modified");
    if (lastModified) headers.set("Last-Modified", lastModified);

    // CRITICAL: Overwrite Supabase's "x-robots-tag: none" with explicit Googlebot-Image approval
    headers.set("X-Robots-Tag", "all, max-image-preview:large");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Security-Policy", "default-src 'none'; sandbox");

    return new Response(method === "HEAD" ? null : upstreamRes.body, {
      status: upstreamRes.status,
      headers,
    });
  } catch (error) {
    console.error("Storage proxy fetch error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyStorageRequest(request, path, "GET");
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyStorageRequest(request, path, "HEAD");
}
