import { routing } from "@/i18n/routing";
import { CORE_PAGE_LOCALIZED_SLUGS } from "@/lib/core-page-slugs";
import { generateNativeSlug } from "@/lib/slug-generator";

type LocalePath = keyof typeof routing.pathnames;

function resolveStaticLocalizedSegment(
  pathname: LocalePath,
  locale: string,
): string {
  if (pathname === "/") return "";
  const coreKey = pathname.replace(/^\//, "");
  const coreSlug = CORE_PAGE_LOCALIZED_SLUGS[coreKey]?.[locale];
  if (coreSlug) {
    return `/${coreSlug}`;
  }
  const pathConfig = routing.pathnames[pathname];
  if (
    typeof pathConfig === "object" &&
    pathConfig !== null &&
    locale in pathConfig
  ) {
    const localizedValue = (pathConfig as Record<string, string>)[locale];
    return localizedValue === "/" ? "" : localizedValue;
  }
  return pathname;
}

export function getLocalizedPaths(
  pathname: LocalePath,
  baseUrl = "https://istanbulportrait.com",
): {
  canonical: (locale: string) => string;
  languages: Record<string, string>;
} {
  // Build language alternates with x-default
  const languages: Record<string, string> = {};
  routing.locales.forEach((l: string) => {
    const localizedPath = resolveStaticLocalizedSegment(pathname, l);
    languages[l] = encodeURI(`${baseUrl}/${l}${localizedPath}`);
  });

  // Add x-default pointing to English version
  languages["x-default"] = languages.en;

  return {
    canonical: (locale: string) => {
      const localizedPath = resolveStaticLocalizedSegment(pathname, locale);
      return encodeURI(`${baseUrl}/${locale}${localizedPath}`);
    },
    languages,
  };
}
export function getBlogPostLocalizedPaths(
  slugs: Record<string, string>,
  baseUrl = "https://istanbulportrait.com",
): {
  canonical: (locale: string) => string;
  languages: Record<string, string>;
} {
  const blogPathConfig = routing.pathnames["/blog"];

  // Build language alternates for blog post with x-default
  const languages: Record<string, string> = {};
  routing.locales.forEach((l: string) => {
    const bp =
      typeof blogPathConfig === "object" && l in blogPathConfig
        ? blogPathConfig[l as keyof typeof blogPathConfig]
        : "/blog";
    const localeSlug = slugs[l] || slugs.en || ""; // Fallback to EN if missing
    if (localeSlug) {
      languages[l] = encodeURI(`${baseUrl}/${l}${bp}/${localeSlug}`);
    }
  });

  // Add x-default pointing to English version
  if (languages.en) {
    languages["x-default"] = languages.en;
  }

  return {
    canonical: (locale: string) => {
      const bp =
        typeof blogPathConfig === "object" && locale in blogPathConfig
          ? blogPathConfig[locale as keyof typeof blogPathConfig]
          : "/blog";
      const localeSlug = slugs[locale] || slugs.en || "";
      return localeSlug
        ? encodeURI(`${baseUrl}/${locale}${bp}/${localeSlug}`)
        : "";
    },
    languages,
  };
}

/**
 * Generate localized URL paths for packages with dynamic slug
 */
export async function getPackageLocalizedPaths(
  slug: string,
  baseUrl = "https://istanbulportrait.com",
): Promise<{
  canonical: (locale: string) => string;
  languages: Record<string, string>;
}> {
  const { packagesService } = await import("@/lib/packages-service");
  const { pagesContentService } = await import("@/lib/pages-content-service");

  const activePackage = await packagesService.getPackageBySlug(slug);
  const packagesPage = await pagesContentService.getPageBySlug("packages");

  // Build language alternates for packages with x-default
  const languages: Record<string, string> = {};

  routing.locales.forEach((l: string) => {
    let localeSlug = slug;
    if (activePackage?.title?.[l]) {
      localeSlug = generateNativeSlug(activePackage.title[l]);
    } else if (activePackage?.slug) {
      localeSlug = activePackage.slug;
    }

    const parentSlug =
      pagesContentService.getCorePageSegment(packagesPage || "packages", l) ||
      "packages";

    languages[l] = encodeURI(`${baseUrl}/${l}/${parentSlug}/${localeSlug}`);
  });

  const defaultParent =
    pagesContentService.getCorePageSegment(packagesPage || "packages", "en") ||
    "packages";
  languages["x-default"] =
    languages.en || encodeURI(`${baseUrl}/en/${defaultParent}/${slug}`);

  return {
    canonical: (locale: string) => {
      let localeSlug = slug;
      if (activePackage?.title?.[locale]) {
        localeSlug = generateNativeSlug(activePackage.title[locale]);
      } else if (activePackage?.slug) {
        localeSlug = activePackage.slug;
      }

      const parentSlug =
        pagesContentService.getCorePageSegment(
          packagesPage || "packages",
          locale,
        ) || "packages";

      return encodeURI(`${baseUrl}/${locale}/${parentSlug}/${localeSlug}`);
    },
    languages,
  };
}

/**
 * Generate localized URL paths for location pages with dynamic slug
 */
export async function getLocationLocalizedPaths(
  slug: string,
  baseUrl = "https://istanbulportrait.com",
): Promise<{
  canonical: (locale: string) => string;
  languages: Record<string, string>;
}> {
  const { locationsService } = await import("@/lib/locations-service");
  const { pagesContentService } = await import("@/lib/pages-content-service");

  const activeLocation = await locationsService.getLocationBySlug(slug);
  const locationsPage = await pagesContentService.getPageBySlug("locations");

  // Build language alternates for location with x-default
  const languages: Record<string, string> = {};
  routing.locales.forEach((l: string) => {
    let localeSlug = slug;
    if (activeLocation?.title?.[l]) {
      localeSlug = generateNativeSlug(activeLocation.title[l]);
    } else if (activeLocation?.slug) {
      localeSlug = activeLocation.slug;
    }

    const parentSlug =
      pagesContentService.getCorePageSegment(locationsPage || "locations", l) ||
      "locations";

    languages[l] = encodeURI(`${baseUrl}/${l}/${parentSlug}/${localeSlug}`);
  });

  // Add x-default pointing to English version
  const defaultParent =
    pagesContentService.getCorePageSegment(
      locationsPage || "locations",
      "en",
    ) || "locations";
  languages["x-default"] =
    languages.en || encodeURI(`${baseUrl}/en/${defaultParent}/${slug}`);

  return {
    canonical: (locale: string) => {
      let localeSlug = slug;
      if (activeLocation?.title?.[locale]) {
        localeSlug = generateNativeSlug(activeLocation.title[locale]);
      } else if (activeLocation?.slug) {
        localeSlug = activeLocation.slug;
      }

      const parentSlug =
        pagesContentService.getCorePageSegment(
          locationsPage || "locations",
          locale,
        ) || "locations";

      return encodeURI(`${baseUrl}/${locale}/${parentSlug}/${localeSlug}`);
    },
    languages,
  };
}

/**
 * Get Open Graph URL for current locale
 */
export function getOpenGraphUrl(
  pathname: LocalePath,
  locale: string,
  baseUrl = "https://istanbulportrait.com",
) {
  const paths = getLocalizedPaths(pathname, baseUrl);
  return paths.canonical(locale);
}

export async function getPackageOpenGraphUrl(
  slug: string,
  locale: string,
  baseUrl = "https://istanbulportrait.com",
) {
  const paths = await getPackageLocalizedPaths(slug, baseUrl);
  return paths.canonical(locale);
}

/**
 * Generate localized URL paths for dynamic core pages (e.g., about, contact, privacy)
 */
export function getDynamicCoreLocalizedPaths(
  internalSlug: string,
  titleObj: Record<string, string | undefined> | undefined,
  baseUrl = "https://istanbulportrait.com",
): {
  canonical: (locale: string) => string;
  languages: Record<string, string>;
} {
  const languages: Record<string, string> = {};

  routing.locales.forEach((l: string) => {
    let localeSlug = internalSlug;
    if (titleObj?.[l]) {
      localeSlug = generateNativeSlug(titleObj[l] as string);
    }
    languages[l] = encodeURI(`${baseUrl}/${l}/${localeSlug}`);
  });

  // Add x-default pointing to English version
  languages["x-default"] =
    languages.en || encodeURI(`${baseUrl}/en/${internalSlug}`);

  return {
    canonical: (locale: string) => {
      let localeSlug = internalSlug;
      if (titleObj?.[locale]) {
        localeSlug = generateNativeSlug(titleObj[locale] as string);
      }
      return encodeURI(`${baseUrl}/${locale}/${localeSlug}`);
    },
    languages,
  };
}
