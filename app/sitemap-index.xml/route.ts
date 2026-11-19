import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/seo-utils";
import { supabaseAdmin } from "@/lib/supabase";
import { generateSitemaps } from "../sitemap";

export const revalidate = 3600;

async function getLatestTimestamp(
  table: string,
  filter?: { column: string; value: unknown },
): Promise<string> {
  const fallback = "2026-01-01T00:00:00.000Z";
  if (!supabaseAdmin) return fallback;

  try {
    let query = supabaseAdmin
      .from(table)
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (filter) {
      query = query.eq(filter.column, filter.value);
    }

    const { data } = await query;
    const ts = data?.[0]?.updated_at;
    return ts ? new Date(ts).toISOString() : fallback;
  } catch {
    return fallback;
  }
}

export async function GET() {
  const baseUrl = getBaseUrl();
  const [sitemaps, coreMod, pkgMod, locMod, postMod, catMod] =
    await Promise.all([
      generateSitemaps(),
      getLatestTimestamp("pages", { column: "is_active", value: true }),
      getLatestTimestamp("packages", { column: "is_active", value: true }),
      getLatestTimestamp("locations", { column: "is_active", value: true }),
      getLatestTimestamp("blog_posts", {
        column: "status",
        value: "published",
      }),
      getLatestTimestamp("blog_categories"),
    ]);

  const lastModById: Record<string, string> = {
    core: coreMod,
    packages: pkgMod,
    locations: locMod,
    "blog-posts": postMod,
    "blog-meta": catMod,
  };

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps
    .map(
      (sitemap) => `
  <sitemap>
    <loc>${baseUrl}/sitemap/${sitemap.id}.xml</loc>
    <lastmod>${lastModById[sitemap.id] || coreMod}</lastmod>
  </sitemap>`,
    )
    .join("")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
