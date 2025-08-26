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
    "/locations": {
      en: "/locations",
      ar: "/المواقع",
      ru: "/локации",
      es: "/ubicaciones",
    },
    "/privacy": {
      en: "/privacy",
      ar: "/الخصوصية",
      ru: "/конфиденциальность",
      es: "/privacidad",
    },
  },
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
