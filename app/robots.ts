import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBaseUrl } from "@/lib/seo-utils";

export default function robots(): MetadataRoute.Robots {
  // Dynamically extract and block all localized checkout/payment pages
  const checkoutRoute = (routing.pathnames as any)["/checkout"];
  const checkoutDisallows: string[] = [];

  if (checkoutRoute && typeof checkoutRoute === "object") {
    for (const [loc, path] of Object.entries(checkoutRoute)) {
      checkoutDisallows.push(`/${loc}${path}`);
      checkoutDisallows.push(`/${loc}${path}/*`);
    }
  } else if (typeof checkoutRoute === "string") {
    checkoutDisallows.push(`/*${checkoutRoute}`);
  } else {
    checkoutDisallows.push("/*/checkout");
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/private/",
          "/*?*booking=", // Disallow parameterized booking tracking
          "/*?*payment=", // Disallow payment gateways
          "/*?*search=", // Disallow parameterized search
          ...checkoutDisallows,
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/storage/", "/_next/image"],
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/storage/", "/_next/image"],
        disallow: ["/admin/", "/api/", ...checkoutDisallows],
      },
    ],
    sitemap: [
      `${getBaseUrl()}/sitemap.xml`,
      `${getBaseUrl()}/sitemap-index.xml`,
    ],
  };
}
