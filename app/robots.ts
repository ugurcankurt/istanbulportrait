import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await settingsService.getSettings().catch(() => null);
  const baseUrl = getBaseUrl(settings?.app_base_url);
  const sharedAllow = [
    "/",
    "/storage/",
    "/_next/image",
    "/llms.txt",
    "/.well-known/ai-catalog.json",
    "/api/packages",
    "/api/booking/availability",
    "/api/og",
    "/api/og-catalog",
    "/api/meta-catalog",
    "/api/meta-offers",
  ];
  const sharedDisallow = [
    "/admin/",
    "/api/",
    "/private/",
    "/*?*booking=",
    "/*?*payment=",
    "/*?*search=",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: sharedAllow,
        disallow: sharedDisallow,
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/storage/", "/_next/image", "/api/og", "/api/og-catalog"],
        disallow: ["/admin/", "/private/"],
      },
      {
        userAgent: "Bingbot",
        allow: sharedAllow,
        disallow: sharedDisallow,
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`],
  };
}
