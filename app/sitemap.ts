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

      // Generate alternate languages for hreflang
      const alternateLanguages: Record<string, string> = {};
      routing.locales.forEach((altLocale) => {
        let altLocalizedPath: string = route;
        if (route !== "" && routing.pathnames[route]) {
          const pathnameConfig = routing.pathnames[route];
          if (typeof pathnameConfig === "object" && altLocale in pathnameConfig) {
            altLocalizedPath = pathnameConfig[altLocale as keyof typeof pathnameConfig] as string;
          }
        }
        alternateLanguages[altLocale] = `${baseUrl}/${altLocale}${altLocalizedPath}`;
      });

      return {
        url: `${baseUrl}/${locale}${localizedPath}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: {
          languages: alternateLanguages,
        },
      };
    }),
  );

  // Get all blog post slugs
  const blogSlugs = await getAllPublishedSlugs();

  // Generate blog post sitemap entries with localized paths
  const blogEntries = blogSlugs.flatMap((slug) =>
    routing.locales.map((locale) => {
      // Get localized blog path from routing config
      const blogPathConfig = routing.pathnames["/blog"];
      const blogPath =
        typeof blogPathConfig === "object" && locale in blogPathConfig
          ? blogPathConfig[locale as keyof typeof blogPathConfig]
          : "/blog";

      // Generate alternate languages for blog posts
      const alternateLanguages: Record<string, string> = {};
      routing.locales.forEach((altLocale) => {
        const altBlogPath =
          typeof blogPathConfig === "object" && altLocale in blogPathConfig
            ? blogPathConfig[altLocale as keyof typeof blogPathConfig]
            : "/blog";
        alternateLanguages[altLocale] = `${baseUrl}/${altLocale}${altBlogPath}/${slug}`;
      });

      return {
        url: `${baseUrl}/${locale}${blogPath}/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
        alternates: {
          languages: alternateLanguages,
        },
      };
    }),
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: {
          en: `${baseUrl}/en`,
          ar: `${baseUrl}/ar`,
          ru: `${baseUrl}/ru`,
          es: `${baseUrl}/es`,
        },
      },
    },
    ...sitemapEntries,
    ...blogEntries,
  ];
}
