import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/seo-utils";
import { generateSitemaps } from "../sitemap";

export async function GET() {
  const baseUrl = getBaseUrl();
  const sitemaps = await generateSitemaps();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps
    .map(
      (sitemap) => `
  <sitemap>
    <loc>${baseUrl}/sitemap/${sitemap.id}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`,
    )
    .join("")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
