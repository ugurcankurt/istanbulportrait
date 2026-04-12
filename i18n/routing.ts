import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "ru", "es", "zh", "fr", "de", "ro"],
  defaultLocale: "en",
  localeDetection: true,
  // Disable automatic hreflang headers - we manage them in page metadata
  // This prevents conflict between header and HTML hreflang tags
  alternateLinks: false,
  pathnames: {
    "/": "/",

    // about, contact, privacy are dynamically managed via DB catch-all.
    "/checkout": {
      en: "/checkout",
      ar: "/dafa",
      ru: "/oplata",
      es: "/pago",
      zh: "/jiesuan",
      fr: "/paiement",
      de: "/kasse",
      ro: "/finalizare",
    },

    "/blog": {
      en: "/blog",
      ar: "/mudawwana",
      ru: "/blog",
      es: "/blog",
      zh: "/blog",
      fr: "/blog",
      de: "/blog",
      ro: "/blog",
    },
    "/blog/[slug]": {
      en: "/blog/[slug]",
      ar: "/mudawwana/[slug]",
      ru: "/blog/[slug]",
      es: "/blog/[slug]",
      zh: "/blog/[slug]",
      fr: "/blog/[slug]",
      de: "/blog/[slug]",
      ro: "/blog/[slug]",
    },

    "/prints": {
      en: "/prints",
      ar: "/matbuat",
      ru: "/pechat",
      es: "/impresiones",
      zh: "/dayin",
      fr: "/impressions",
      de: "/drucke",
      ro: "/printuri",
    },
    "/prints/[slug]": {
      en: "/prints/[slug]",
      ar: "/matbuat/[slug]",
      ru: "/pechat/[slug]",
      es: "/impresiones/[slug]",
      zh: "/dayin/[slug]",
      fr: "/impressions/[slug]",
      de: "/drucke/[slug]",
      ro: "/printuri/[slug]",
    },
    "/prints/checkout": {
      en: "/prints/checkout",
      ar: "/matbuat/dafa",
      ru: "/pechat/oplata",
      es: "/impresiones/pago",
      zh: "/dayin/jiesuan",
      fr: "/impressions/paiement",
      de: "/drucke/kasse",
      ro: "/printuri/finalizare",
    },
    "/prints/checkout/success": {
      en: "/prints/checkout/success",
      ar: "/matbuat/dafa/najah",
      ru: "/pechat/oplata/uspekh",
      es: "/impresiones/pago/exito",
      zh: "/dayin/jiesuan/chenggong",
      fr: "/impressions/paiement/succes",
      de: "/drucke/kasse/erfolg",
      ro: "/printuri/finalizare/succes",
    },
  },
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
