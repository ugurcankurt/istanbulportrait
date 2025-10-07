import type { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/lib/seo-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SEO_CONFIG.site.url;

  return {
    rules: [
      // General crawlers - allow everything except private areas
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/_next/",
          "/admin/",
          "/private/",
          "/*.json$",
          "/checkout/success",
          "/checkout/cancel",
        ],
      },
      // AI-specific crawlers optimization
      {
        userAgent: ["GPTBot", "Claude-Web", "PerplexityBot", "ChatGPT-User"],
        allow: [
          "/",
          "/packages",
          "/about",
          "/contact",
          "/faq",
          "/ai-training.txt",
        ],
        disallow: ["/api/", "/_next/", "/admin/", "/private/", "/checkout/"],
      },
      // Google's AI crawler
      {
        userAgent: "Google-Extended",
        allow: [
          "/",
          "/packages",
          "/about",
          "/contact",
          "/faq",
          "/ai-training.txt",
        ],
        disallow: ["/api/", "/_next/", "/admin/"],
      },
      // Bing's AI crawler
      {
        userAgent: "CCBot",
        allow: [
          "/",
          "/packages",
          "/about",
          "/contact",
          "/faq",
          "/ai-training.txt",
        ],
        disallow: ["/api/", "/_next/", "/admin/"],
      },
      // Yandex search bot
      {
        userAgent: "YandexBot",
        allow: "/",
        disallow: ["/api/", "/_next/", "/admin/"],
        crawlDelay: 2,
      },
      // Facebook social media crawler
      {
        userAgent: "facebookexternalhit",
        allow: ["/", "/packages", "/about"],
        disallow: ["/api/", "/admin/"],
      },
      // Block aggressive crawlers
      {
        userAgent: [
          "AhrefsBot",
          "SemrushBot",
          "MJ12bot",
          "DotBot",
          "AspiegelBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/image-sitemap.xml`,
    ],
  };
}
