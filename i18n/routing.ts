import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "ru", "es", "zh", "fr", "de", "ro", "tr"],
  defaultLocale: "en",
  localeDetection: true,
  // Disable automatic hreflang headers - we manage them in page metadata
  // This prevents conflict between header and HTML hreflang tags
  alternateLinks: false,
  pathnames: {
    "/": "/",

    // about, contact, privacy are dynamically managed via DB catch-all.
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/packages": "/packages",
    "/packages/[slug]": "/packages/[slug]",
    "/locations": "/locations",
    "/locations/[slug]": "/locations/[slug]",
    "/about": "/about",
    "/privacy": "/privacy",
    "/contact": "/contact",
    "/account": "/account",
    "/account/login": "/account/login",
    "/account/dashboard": "/account/dashboard",
    "/account/update-password": "/account/update-password",
    "/account/gallery": "/account/gallery",
    "/account/gallery/[bookingId]": "/account/gallery/[bookingId]",
    "/account/payments": "/account/payments",
    "/checkout": {
      en: "/checkout",
      ar: "/dafa",
      ru: "/oplata",
      es: "/pago",
      zh: "/jiesuan",
      fr: "/paiement",
      de: "/kasse",
      ro: "/finalizare",
      tr: "/odeme",
    },
  },
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
