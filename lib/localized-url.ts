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
 * Generate localized URL paths for blog posts with dynamic slug
 * Uses the localized /blog path for each language (e.g., /ar/mudawwana, /ru/blog)
 */
export function getBlogPostLocalizedPaths(
  slug: string,
  baseUrl = SEO_CONFIG.site.url,
): {
  canonical: (locale: string) => string;
  languages: Record<string, string>;
} {
  const blogPathConfig = routing.pathnames["/blog"];

  // Get localized blog path for each locale
  const getLocalizedBlogPath = (locale: string): string => {
    if (typeof blogPathConfig === "object" && locale in blogPathConfig) {
      return blogPathConfig[locale as keyof typeof blogPathConfig];
    }
    return "/blog";
  };

  return {
    canonical: (locale: string) =>
      `${baseUrl}/${locale}${getLocalizedBlogPath(locale)}/${slug}`,
    languages: {
      en: `${baseUrl}/en${getLocalizedBlogPath("en")}/${slug}`,
      ar: `${baseUrl}/ar${getLocalizedBlogPath("ar")}/${slug}`,
      ru: `${baseUrl}/ru${getLocalizedBlogPath("ru")}/${slug}`,
      es: `${baseUrl}/es${getLocalizedBlogPath("es")}/${slug}`,
      zh: `${baseUrl}/zh${getLocalizedBlogPath("zh")}/${slug}`,
      "x-default": `${baseUrl}/en${getLocalizedBlogPath("en")}/${slug}`,
    },
  };
}

/**
 * Generate localized URL paths for packages with dynamic slug
 */
export function getPackageLocalizedPaths(
  slug: string,
  baseUrl = SEO_CONFIG.site.url,
): {
  canonical: (locale: string) => string;
  languages: Record<string, string>;
} {
  const packagePathConfig = routing.pathnames["/packages/[slug]"];

  // Get localized package path for each locale
  const getLocalizedPackagePath = (locale: string): string => {
    if (typeof packagePathConfig === "object" && locale in packagePathConfig) {
      // Replace [slug] with actual slug
      return packagePathConfig[locale as keyof typeof packagePathConfig].replace(
        "[slug]",
        slug,
      );
    }
    return `/packages/${slug}`;
  };

  return {
    canonical: (locale: string) =>
      `${baseUrl}/${locale}${getLocalizedPackagePath(locale)}`,
    languages: {
      en: `${baseUrl}/en${getLocalizedPackagePath("en")}`,
      ar: `${baseUrl}/ar${getLocalizedPackagePath("ar")}`,
      ru: `${baseUrl}/ru${getLocalizedPackagePath("ru")}`,
      es: `${baseUrl}/es${getLocalizedPackagePath("es")}`,
      zh: `${baseUrl}/zh${getLocalizedPackagePath("zh")}`,
      fr: `${baseUrl}/fr${getLocalizedPackagePath("fr")}`,
      de: `${baseUrl}/de${getLocalizedPackagePath("de")}`,
      ro: `${baseUrl}/ro${getLocalizedPackagePath("ro")}`,
      "x-default": `${baseUrl}/en${getLocalizedPackagePath("en")}`,
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

export function getPackageOpenGraphUrl(
  slug: string,
  locale: string,
  baseUrl = SEO_CONFIG.site.url,
) {
  const paths = getPackageLocalizedPaths(slug, baseUrl);
  return paths.canonical(locale);
}
