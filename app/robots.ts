import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo-utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/llms.txt",
          "/.well-known/ai-catalog.json",
          "/api/packages",
          "/api/booking/availability",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/private/",
          "/account/",
          "/*/account/",
          "/*?*booking=", // Disallow parameterized booking tracking
          "/*?*payment=", // Disallow payment gateways
          "/*?*search=", // Disallow parameterized search
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/storage/", "/_next/image"],
        disallow: ["/admin/", "/api/", "/account/", "/*/account/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/storage/", "/_next/image"],
        disallow: [
          "/admin/",
          "/api/",
          "/account/",
          "/*/account/",
        ],
      },
    ],
    sitemap: [`${getBaseUrl()}/sitemap.xml`],
  };
}
