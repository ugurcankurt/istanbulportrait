import { routing } from "@/i18n/routing";
import { SEO_CONFIG } from "@/lib/seo-config";

type LocalePath = keyof typeof routing.pathnames;

/**
 * Generate localized URL paths for hreflang and canonical URLs
 */
export function getLocalizedPaths(
  pathname: LocalePath,
  baseUrl = SEO_CONFIG.site.url,
) {
  const pathConfig = routing.pathnames[pathname];

  if (!pathConfig || typeof pathConfig === "string") {
    // Simple path case (like "/")
    return {
      canonical: (locale: string) =>
        `${baseUrl}/${locale}${pathname === "/" ? "" : pathname}`,
      languages: {
        "x-default": `${baseUrl}/en${pathname === "/" ? "" : pathname}`,
        en: `${baseUrl}/en${pathname === "/" ? "" : pathname}`,
        ar: `${baseUrl}/ar${pathname === "/" ? "" : pathname}`,
        ru: `${baseUrl}/ru${pathname === "/" ? "" : pathname}`,
        es: `${baseUrl}/es${pathname === "/" ? "" : pathname}`,
      },
    };
  }

  // Localized path case
  return {
    canonical: (locale: string) =>
      `${baseUrl}/${locale}${pathConfig[locale as keyof typeof pathConfig]}`,
    languages: {
      "x-default": `${baseUrl}/en${pathConfig.en}`,
      en: `${baseUrl}/en${pathConfig.en}`,
      ar: `${baseUrl}/ar${pathConfig.ar}`,
      ru: `${baseUrl}/ru${pathConfig.ru}`,
      es: `${baseUrl}/es${pathConfig.es}`,
    },
  };
}

/**
 * Get Open Graph URL for current locale
 */
export function getOpenGraphUrl(
  pathname: LocalePath,
  locale: string,
  baseUrl = SEO_CONFIG.site.url,
) {
  const paths = getLocalizedPaths(pathname, baseUrl);
  return paths.canonical(locale);
}
