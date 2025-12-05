import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "ru", "es", "zh"],
  defaultLocale: "en",
  localeDetection: true,
  // Disable automatic hreflang headers - we manage them in page metadata
  // This prevents conflict between header and HTML hreflang tags
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/packages": {
      en: "/packages",
      ar: "/hazm",
      ru: "/pakety",
      es: "/paquetes",
      zh: "/taocan",
    },
    "/tours": {
      en: "/tours",
      ar: "/jawlat",
      ru: "/tury",
      es: "/tours",
      zh: "/lvyou",
    },
    "/about": {
      en: "/about",
      ar: "/hawl",
      ru: "/o-nas",
      es: "/acerca",
      zh: "/guanyu",
    },
    "/contact": {
      en: "/contact",
      ar: "/ittisal",
      ru: "/kontakt",
      es: "/contacto",
      zh: "/lianxi",
    },
    "/checkout": {
      en: "/checkout",
      ar: "/dafa",
      ru: "/oplata",
      es: "/pago",
      zh: "/jiesuan",
    },
    "/locations": {
      en: "/locations",
      ar: "/mawaqe",
      ru: "/lokatsii",
      es: "/ubicaciones",
      zh: "/didian",
    },
    "/privacy": {
      en: "/privacy",
      ar: "/khususiya",
      ru: "/konfidentsialnost",
      es: "/privacidad",
      zh: "/yinsi",
    },
    "/blog": {
      en: "/blog",
      ar: "/mudawwana",
      ru: "/blog",
      es: "/blog",
      zh: "/blog",
    },
    "/blog/[slug]": {
      en: "/blog/[slug]",
      ar: "/mudawwana/[slug]",
      ru: "/blog/[slug]",
      es: "/blog/[slug]",
      zh: "/blog/[slug]",
    },
  },
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
