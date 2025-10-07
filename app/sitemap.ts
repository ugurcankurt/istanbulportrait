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

  const sitemapEntries = routes.map((route) => {
    let changeFrequency: "daily" | "weekly" | "monthly" = "weekly";
    let priority = 0.8;

    // Set SEO-optimized frequencies and priorities for 2025
    if (route === "") {
      changeFrequency = "daily";
      priority = 1.0;
    } else if (route === "/packages") {
      changeFrequency = "weekly";
      priority = 0.9;
    } else if (route === "/checkout") {
      changeFrequency = "weekly";
      priority = 0.85;
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

    // Build language alternates
    const languages: Record<string, string> = {};
    routing.locales.forEach((locale) => {
      let localizedPath: string = route;
      if (route !== "" && routing.pathnames[route]) {
        const pathnameConfig = routing.pathnames[route];
        if (typeof pathnameConfig === "object" && locale in pathnameConfig) {
          localizedPath = pathnameConfig[locale as keyof typeof pathnameConfig] as string;
        }
      }
      languages[locale] = `${baseUrl}/${locale}${localizedPath}`;
    });

    return {
      url: `${baseUrl}/en${route === "" ? "" : route}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: {
        languages,
      },
    };
  });

  // Get all blog post slugs
  const blogSlugs = await getAllPublishedSlugs();

  // Generate blog post sitemap entries with localized paths
  const blogEntries = blogSlugs.map((slug) => {
    const blogPathConfig = routing.pathnames["/blog"];

    // Build language alternates for blog post
    const languages: Record<string, string> = {};
    routing.locales.forEach((locale) => {
      const blogPath =
        typeof blogPathConfig === "object" && locale in blogPathConfig
          ? blogPathConfig[locale as keyof typeof blogPathConfig]
          : "/blog";
      languages[locale] = `${baseUrl}/${locale}${blogPath}/${slug}`;
    });

    return {
      url: `${baseUrl}/en/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages,
      },
    };
  });

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
