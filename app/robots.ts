import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
      ],
    },
    sitemap: "https://istanbulphotosession.com.tr/sitemap.xml",
  };
}
