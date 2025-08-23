import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "ar", "ru", "es"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/packages": {
      en: "/packages",
      ar: "/الحزم",
      ru: "/пакеты",
      es: "/paquetes",
    },
    "/about": {
      en: "/about",
      ar: "/حول",
      ru: "/о-нас",
      es: "/acerca",
    },
    "/contact": {
      en: "/contact",
      ar: "/اتصال",
      ru: "/контакт",
      es: "/contacto",
    },
    "/checkout": {
      en: "/checkout",
      ar: "/الدفع",
      ru: "/оплата",
      es: "/pago",
    },
  },
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
