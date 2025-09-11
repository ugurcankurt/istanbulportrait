import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://istanbulportrait.com";

  const routes = ["", "/packages", "/about", "/contact", "/privacy", "/checkout"];

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
      } else if (route === "/privacy") {
        changeFrequency = "monthly";
        priority = 0.3;
      }

      return {
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      };
    }),
  );

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...sitemapEntries,
  ];
}
