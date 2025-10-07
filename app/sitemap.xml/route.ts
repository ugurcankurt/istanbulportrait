import { routing } from "@/i18n/routing";
import { getAllPublishedSlugs } from "@/lib/blog/blog-service";

/**
 * Custom XML sitemap with hreflang support
 * Next.js MetadataRoute.Sitemap doesn't support xhtml:link, so we generate XML directly
 * This implements 2025 SEO best practices for multilingual sites
 */

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  alternates: { hreflang: string; href: string }[];
}

function getLocalizedPath(route: string, locale: string): string {
  if (route === "") return "";

  const pathnameConfig = routing.pathnames[route as keyof typeof routing.pathnames];
  if (!pathnameConfig || typeof pathnameConfig === "string") {
    return route;
  }

  return pathnameConfig[locale as keyof typeof pathnameConfig] as string;
}

function generateAlternates(baseUrl: string, route: string): { hreflang: string; href: string }[] {
  const alternates: { hreflang: string; href: string }[] = [];

  // x-default (fallback for unmatched languages)
  const enPath = getLocalizedPath(route, "en");
  alternates.push({
    hreflang: "x-default",
    href: `${baseUrl}/en${enPath}`,
  });

  // All language versions
  for (const locale of routing.locales) {
    const localizedPath = getLocalizedPath(route, locale);
    alternates.push({
      hreflang: locale,
      href: `${baseUrl}/${locale}${localizedPath}`,
    });
  }

  return alternates;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlsXml = urls
    .map((url) => {
      const alternatesXml = url.alternates
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}" />`
        )
        .join("\n");

      return `  <url>
    <loc>${escapeXml(url.loc)}</loc>
${alternatesXml}
    <lastmod>${escapeXml(url.lastmod)}</lastmod>
    <changefreq>${escapeXml(url.changefreq)}</changefreq>
    <priority>${escapeXml(url.priority)}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml}
</urlset>`;
}

export async function GET() {
  const baseUrl = "https://istanbulportrait.com";
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const routes = [
    { path: "", changefreq: "daily", priority: "1.0", lastmod: "2025-10-01" },
    { path: "/packages", changefreq: "weekly", priority: "0.9", lastmod: "2025-10-01" },
    { path: "/about", changefreq: "monthly", priority: "0.8", lastmod: "2025-09-15" },
    { path: "/contact", changefreq: "monthly", priority: "0.75", lastmod: "2025-09-15" },
    { path: "/privacy", changefreq: "monthly", priority: "0.3", lastmod: "2025-09-01" },
    { path: "/checkout", changefreq: "weekly", priority: "0.85", lastmod: "2025-10-01" },
    { path: "/blog", changefreq: "daily", priority: "0.85", lastmod: currentDate },
  ];

  const urls: SitemapUrl[] = [];

  // Homepage (special case - no locale in path for root)
  urls.push({
    loc: baseUrl,
    lastmod: "2025-10-01T00:00:00.000Z",
    changefreq: "daily",
    priority: "1.0",
    alternates: [
      { hreflang: "x-default", href: `${baseUrl}/en` },
      { hreflang: "en", href: `${baseUrl}/en` },
      { hreflang: "ar", href: `${baseUrl}/ar` },
      { hreflang: "ru", href: `${baseUrl}/ru` },
      { hreflang: "es", href: `${baseUrl}/es` },
    ],
  });

  // Static pages with all language variants
  for (const route of routes) {
    for (const locale of routing.locales) {
      const localizedPath = getLocalizedPath(route.path, locale);
      const url = `${baseUrl}/${locale}${localizedPath}`;

      urls.push({
        loc: url,
        lastmod: `${route.lastmod}T00:00:00.000Z`,
        changefreq: route.changefreq,
        priority: route.priority,
        alternates: generateAlternates(baseUrl, route.path),
      });
    }
  }

  // Blog posts with all language variants
  try {
    const blogSlugs = await getAllPublishedSlugs();

    for (const slug of blogSlugs) {
      const blogRoute = `/blog/[slug]`;
      const blogPathConfig = routing.pathnames["/blog"];

      for (const locale of routing.locales) {
        const blogPath =
          typeof blogPathConfig === "object" && locale in blogPathConfig
            ? blogPathConfig[locale as keyof typeof blogPathConfig]
            : "/blog";

        const url = `${baseUrl}/${locale}${blogPath}/${slug}`;

        // Generate alternates for blog post
        const blogAlternates: { hreflang: string; href: string }[] = [];

        // x-default
        const enBlogPath =
          typeof blogPathConfig === "object" && "en" in blogPathConfig
            ? blogPathConfig.en
            : "/blog";
        blogAlternates.push({
          hreflang: "x-default",
          href: `${baseUrl}/en${enBlogPath}/${slug}`,
        });

        // All locales
        for (const altLocale of routing.locales) {
          const altBlogPath =
            typeof blogPathConfig === "object" && altLocale in blogPathConfig
              ? blogPathConfig[altLocale as keyof typeof blogPathConfig]
              : "/blog";
          blogAlternates.push({
            hreflang: altLocale,
            href: `${baseUrl}/${altLocale}${altBlogPath}/${slug}`,
          });
        }

        urls.push({
          loc: url,
          lastmod: `${currentDate}T00:00:00.000Z`,
          changefreq: "weekly",
          priority: "0.7",
          alternates: blogAlternates,
        });
      }
    }
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error);
  }

  const xml = generateSitemapXml(urls);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
