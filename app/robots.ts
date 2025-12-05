import type { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/lib/seo-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SEO_CONFIG.site.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/"],
      },
      {
        userAgent: "YandexBot",
        crawlDelay: 2,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
