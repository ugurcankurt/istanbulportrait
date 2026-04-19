import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getBaseUrl } from "@/lib/seo-utils";

export default function robots(): MetadataRoute.Robots {
  // Dynamically extract and block all localized checkout/payment pages
  const checkoutRoute = (routing.pathnames as any)["/checkout"];
  const checkoutDisallows = checkoutRoute ? (typeof checkoutRoute === "string" ? [`/*${checkoutRoute}*`] : Object.values(checkoutRoute).map(path => `/*${path}*`)) : ["/*checkout*"];
  
  const printsRoute = (routing.pathnames as any)["/prints/checkout"];
  const printsCheckoutDisallows = printsRoute ? (typeof printsRoute === "string" ? [`/*${printsRoute}*`] : Object.values(printsRoute).map(path => `/*${path}*`)) : ["/*prints/checkout*"];

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
        ...printsCheckoutDisallows,
      ],
    },
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}
