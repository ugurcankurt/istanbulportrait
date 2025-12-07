import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllPublishedSlugsWithDates } from "@/lib/blog/blog-service";
import { getAllLocationSlugs } from "@/lib/locations/location-data";

/**
 * SEO-Optimized Sitemap for Istanbul Portrait
 * 
 * Google 2025-2026 Best Practices:
 * - Proper hreflang with x-default
 * - Real lastmod dates (not dynamic)
 * - No checkout/transactional pages
 * - Appropriate changeFrequency and priority
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://istanbulportrait.com";

  // Static page last modified date - update this when major content changes occur
  const staticPagesLastMod = new Date("2025-12-06T00:00:00Z");

  // Define static routes - excluding checkout (transactional page, no SEO value)
  type PathnameKey = keyof typeof routing.pathnames;
  const routes: PathnameKey[] = [
    "/",
    "/packages",
    "/about",
    "/contact",
    "/privacy",
    "/blog",
    "/locations",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Generate entries for static routes
  for (const route of routes) {
    for (const locale of routing.locales) {
      let changeFrequency: "daily" | "weekly" | "monthly" = "weekly";
      let priority = 0.8;

      // Set SEO-optimized frequencies and priorities
      if (route === "/") {
        changeFrequency = "weekly";
        priority = 1.0;
      } else if (route === "/packages") {
        changeFrequency = "weekly";
        priority = 0.9;
      } else if (route === "/about") {
        changeFrequency = "monthly";
        priority = 0.8;
      } else if (route === "/contact") {
        changeFrequency = "monthly";
        priority = 0.75;
      } else if (route === "/blog") {
        changeFrequency = "daily";
        priority = 0.85;
      } else if (route === "/privacy") {
        changeFrequency = "monthly";
        priority = 0.3;
      }

      // Get localized path for current locale
      let currentLocalizedPath: string = route === "/" ? "" : route;
      const pathnameConfig = routing.pathnames[route];
      if (typeof pathnameConfig === "object" && pathnameConfig !== null && locale in pathnameConfig) {
        const localizedValue = (pathnameConfig as Record<string, string>)[locale];
        currentLocalizedPath = localizedValue === "/" ? "" : localizedValue;
      }

      // Build language alternates with x-default
      const languages: Record<string, string> = {};
      routing.locales.forEach((l) => {
        let localizedPath: string = route === "/" ? "" : route;
        if (typeof pathnameConfig === "object" && pathnameConfig !== null && l in pathnameConfig) {
          const localizedValue = (pathnameConfig as Record<string, string>)[l];
          localizedPath = localizedValue === "/" ? "" : localizedValue;
        }
        languages[l] = `${baseUrl}/${l}${localizedPath}`;
      });

      // Add x-default pointing to English version (primary language)
      languages["x-default"] = languages["en"];

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${currentLocalizedPath}`,
        lastModified: staticPagesLastMod,
        changeFrequency,
        priority,
        alternates: {
          languages,
        },
      });
    }
  }

  // Get all blog posts with their actual dates
  const blogPosts = await getAllPublishedSlugsWithDates();

  // Generate blog post sitemap entries
  for (const post of blogPosts) {
    for (const locale of routing.locales) {
      const blogPathConfig = routing.pathnames["/blog"];
      const blogPath =
        typeof blogPathConfig === "object" && locale in blogPathConfig
          ? blogPathConfig[locale as keyof typeof blogPathConfig]
          : "/blog";

      // Build language alternates for blog post with x-default
      const languages: Record<string, string> = {};
      routing.locales.forEach((l) => {
        const bp =
          typeof blogPathConfig === "object" && l in blogPathConfig
            ? blogPathConfig[l as keyof typeof blogPathConfig]
            : "/blog";
        languages[l] = `${baseUrl}/${l}${bp}/${post.slug}`;
      });

      // Add x-default pointing to English version
      languages["x-default"] = languages["en"];

      // Use the most recent date: updated_at or published_at
      const lastmod = new Date(post.updated_at > post.published_at ? post.updated_at : post.published_at);

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${blogPath}/${post.slug}`,
        lastModified: lastmod,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages,
        },
      });
    }
  }

  // Generate location pages sitemap entries
  const locationSlugs = getAllLocationSlugs();
  for (const slug of locationSlugs) {
    for (const locale of routing.locales) {
      const locationsPathConfig = routing.pathnames["/locations"];
      const locationsPath =
        typeof locationsPathConfig === "object" && locale in locationsPathConfig
          ? locationsPathConfig[locale as keyof typeof locationsPathConfig]
          : "/locations";

      // Build language alternates for location with x-default
      const languages: Record<string, string> = {};
      routing.locales.forEach((l) => {
        const lp =
          typeof locationsPathConfig === "object" && l in locationsPathConfig
            ? locationsPathConfig[l as keyof typeof locationsPathConfig]
            : "/locations";
        languages[l] = `${baseUrl}/${l}${lp}/${slug}`;
      });

      // Add x-default pointing to English version
      languages["x-default"] = languages["en"];

      sitemapEntries.push({
        url: `${baseUrl}/${locale}${locationsPath}/${slug}`,
        lastModified: staticPagesLastMod,
        changeFrequency: "monthly",
        priority: 0.75,
        alternates: {
          languages,
        },
      });
    }
  }

  // Add ai-training.txt for AI crawler discovery (2025 best practice)
  sitemapEntries.push({
    url: `${baseUrl}/ai-training.txt`,
    lastModified: staticPagesLastMod,
    changeFrequency: "monthly",
    priority: 0.5,
  });

  return sitemapEntries;
}
