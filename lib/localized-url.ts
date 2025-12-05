import { routing } from "@/i18n/routing";
import { SEO_CONFIG } from "@/lib/seo-config";

type LocalePath = keyof typeof routing.pathnames;

/**
 * Generate localized URL paths for hreflang and canonical URLs
 * Includes x-default pointing to English version for Google SEO best practices
 */
export function getLocalizedPaths(
  pathname: LocalePath,
  baseUrl = SEO_CONFIG.site.url,
): {
  canonical: (locale: string) => string;
  languages: Record<string, string>;
} {
  const pathConfig = routing.pathnames[pathname];

  if (!pathConfig || typeof pathConfig === "string") {
    // Simple path case (like "/")
    const pathSuffix = pathname === "/" ? "" : pathname;
    return {
      canonical: (locale: string) => `${baseUrl}/${locale}${pathSuffix}`,
      languages: {
        en: `${baseUrl}/en${pathSuffix}`,
        ar: `${baseUrl}/ar${pathSuffix}`,
        ru: `${baseUrl}/ru${pathSuffix}`,
        es: `${baseUrl}/es${pathSuffix}`,
        zh: `${baseUrl}/zh${pathSuffix}`,
        "x-default": `${baseUrl}/en${pathSuffix}`,
      },
    };
  }

  // Localized path case
  return {
    canonical: (locale: string) =>
      `${baseUrl}/${locale}${pathConfig[locale as keyof typeof pathConfig]}`,
    languages: {
      en: `${baseUrl}/en${pathConfig.en}`,
      ar: `${baseUrl}/ar${pathConfig.ar}`,
      ru: `${baseUrl}/ru${pathConfig.ru}`,
      es: `${baseUrl}/es${pathConfig.es}`,
      zh: `${baseUrl}/zh${pathConfig.zh}`,
      "x-default": `${baseUrl}/en${pathConfig.en}`,
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
