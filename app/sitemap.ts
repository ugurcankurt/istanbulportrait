import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllPublishedSlugs } from "@/lib/blog/blog-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://istanbulportrait.com";

  const routes = [
    "",
    "/packages",
    "/about",
    "/contact",
    "/privacy",
    "/checkout",
    "/blog",
  ] as const;

  const sitemapEntries = routes.flatMap((route) =>
    routing.locales.map((locale) => {
      let changeFrequency: "daily" | "weekly" | "monthly" = "weekly";
      let priority = 0.8;

      // Set SEO-optimized frequencies and priorities for 2025
      // Optimized for Bing, Yandex, and other search engines
      if (route === "") {
        changeFrequency = "daily";
        priority = 1.0;
      } else if (route === "/packages") {
        changeFrequency = "weekly";
        priority = 0.9; // High priority for conversion pages
      } else if (route === "/checkout") {
        changeFrequency = "weekly";
        priority = 0.85; // Important for conversion funnel
      } else if (route === "/about") {
        changeFrequency = "monthly";
        priority = 0.8; // Good for brand authority
      } else if (route === "/contact") {
        changeFrequency = "monthly";
        priority = 0.75; // Contact pages are important for local SEO
      } else if (route === "/blog") {
        changeFrequency = "daily";
        priority = 0.85; // High priority for blog content
      } else if (route === "/privacy") {
        changeFrequency = "monthly";
        priority = 0.3;
      }

      // Get localized path from routing config
      let localizedPath: string = route;
      if (route !== "" && routing.pathnames[route]) {
        const pathnameConfig = routing.pathnames[route];
        if (typeof pathnameConfig === "object" && locale in pathnameConfig) {
          localizedPath = pathnameConfig[locale as keyof typeof pathnameConfig] as string;
        }
      }

      return {
        url: `${baseUrl}/${locale}${localizedPath}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      };
    }),
  );

  // Get all blog post slugs
  const blogSlugs = await getAllPublishedSlugs();

  // Generate blog post sitemap entries
  const blogEntries = blogSlugs.flatMap((slug) =>
    routing.locales.map((locale) => ({
      url: `${baseUrl}/${locale}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...sitemapEntries,
    ...blogEntries,
  ];
}
