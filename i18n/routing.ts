import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "ru", "es"],
  defaultLocale: "en",
  localeDetection: true,
  pathnames: {
    "/": "/",
    "/packages": {
      en: "/packages",
      ar: "/hazm",
      ru: "/pakety",
      es: "/paquetes",
    },
    "/tours": {
      en: "/tours",
      ar: "/jawlat",
      ru: "/tury",
      es: "/tours",
    },
    "/about": {
      en: "/about",
      ar: "/hawl",
      ru: "/o-nas",
      es: "/acerca",
    },
    "/contact": {
      en: "/contact",
      ar: "/ittisal",
      ru: "/kontakt",
      es: "/contacto",
    },
    "/checkout": {
      en: "/checkout",
      ar: "/dafa",
      ru: "/oplata",
      es: "/pago",
    },
    "/locations": {
      en: "/locations",
      ar: "/mawaqe",
      ru: "/lokatsii",
      es: "/ubicaciones",
    },
    "/privacy": {
      en: "/privacy",
      ar: "/khususiya",
      ru: "/konfidentsialnost",
      es: "/privacidad",
    },
  },
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
