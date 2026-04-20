import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBaseUrl } from "@/lib/seo-utils";

export default function robots(): MetadataRoute.Robots {
  // Dynamically extract and block all localized checkout/payment pages
  const checkoutRoute = (routing.pathnames as any)["/checkout"];
  const checkoutDisallows = checkoutRoute ? (typeof checkoutRoute === "string" ? [`/*${checkoutRoute}*`] : Object.values(checkoutRoute).map(path => `/*${path}*`)) : ["/*checkout*"];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/private/",
        "/*?*booking*", // Disallow parameterized booking states
        "/*?*payment*", // Disallow payment gateways
        "/*?*search=",  // Disallow user search queries
        ...checkoutDisallows,
      ],
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
