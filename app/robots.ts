import type { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/lib/seo-config";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = SEO_CONFIG.site.url;

    return {
      rules: [
        // Tüm botlar için genel kural
        {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/api/",
            "/_next/",
            "/admin/",
            "/private/",
            "/checkout/success",
            "/checkout/cancel",
          ],
        },
        // Yandex için özel crawl hızı
        {
          userAgent: "YandexBot",
          crawlDelay: 2,
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }