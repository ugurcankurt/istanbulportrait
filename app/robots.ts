import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export default function robots(): MetadataRoute.Robots {
  // Dynamically extract and block all localized checkout/payment pages
  const checkoutDisallows = Object.values(routing.pathnames["/checkout"]).map(path => `/*${path}*`);
  const printsCheckoutDisallows = Object.values(routing.pathnames["/prints/checkout"]).map(path => `/*${path}*`);

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
    sitemap: "https://360istanbul.com.tr/sitemap.xml",
  };
}
