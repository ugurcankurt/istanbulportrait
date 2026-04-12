import { routing } from "@/i18n/routing";

import { packagesService } from "@/lib/packages-service";
import { generateNativeSlug } from "@/lib/slug-generator";

type LocalePath = keyof typeof routing.pathnames;
export function getLocalizedPaths(
  pathname: LocalePath,
  baseUrl = "https://istanbulphotosession.com.tr",
): {
  canonical: (locale: string) => string;
  languages: Record<string, string>;
} {
  const pathConfig = routing.pathnames[pathname];

  // Build language alternates with x-default
  const languages: Record<string, string> = {};
  routing.locales.forEach((l: string) => {
    let localizedPath: string = pathname === "/" ? "" : pathname;
    if (
      typeof pathConfig === "object" &&
      pathConfig !== null &&
      l in pathConfig
    ) {
      const localizedValue = (pathConfig as Record<string, string>)[l];
      localizedPath = localizedValue === "/" ? "" : localizedValue;
    }
    languages[l] = `${baseUrl}/${l}${localizedPath}`;
  });

  // Add x-default pointing to English version
  languages["x-default"] = languages["en"];

  return {
    canonical: (locale: string) => {
      let localizedPath: string = pathname === "/" ? "" : pathname;
      if (
        typeof pathConfig === "object" &&
        pathConfig !== null &&
        locale in pathConfig
      ) {
        const localizedValue = (pathConfig as Record<string, string>)[locale];
        localizedPath = localizedValue === "/" ? "" : localizedValue;
      }
      return `${baseUrl}/${locale}${localizedPath}`;
    },
    languages,
  };
}
export function getBlogPostLocalizedPaths(
  slugs: Record<string, string>,
  baseUrl = "https://istanbulphotosession.com.tr",
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
    const localeSlug = slugs[l] || slugs["en"] || ""; // Fallback to EN if missing
    if (localeSlug) {
      languages[l] = `${baseUrl}/${l}${bp}/${localeSlug}`;
    }
  });

  // Add x-default pointing to English version
  if (languages["en"]) {
    languages["x-default"] = languages["en"];
  }

  return {
    canonical: (locale: string) => {
      const bp =
        typeof blogPathConfig === "object" && locale in blogPathConfig
          ? blogPathConfig[locale as keyof typeof blogPathConfig]
          : "/blog";
      const localeSlug = slugs[locale] || slugs["en"] || "";
      return localeSlug ? `${baseUrl}/${locale}${bp}/${localeSlug}` : "";
    },
    languages,
  };
}

/**
 * Generate localized URL paths for packages with dynamic slug
 */
export async function getPackageLocalizedPaths(
  slug: string,
  baseUrl = "https://istanbulphotosession.com.tr",
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

    let parentSlug = packagesPage?.slug || "packages";
    if (packagesPage?.title?.[l]) {
      parentSlug = generateNativeSlug(packagesPage.title[l]);
    }

    languages[l] = `${baseUrl}/${l}/${parentSlug}/${localeSlug}`;
  });

  const defaultParent = packagesPage?.title?.en ? generateNativeSlug(packagesPage.title.en) : "packages";
  languages["x-default"] = languages["en"] || `${baseUrl}/en/${defaultParent}/${slug}`;

  return {
    canonical: (locale: string) => {
      let localeSlug = slug;
      if (activePackage?.title?.[locale]) {
        localeSlug = generateNativeSlug(activePackage.title[locale]);
      } else if (activePackage?.slug) {
        localeSlug = activePackage.slug;
      }

      let parentSlug = packagesPage?.slug || "packages";
      if (packagesPage?.title?.[locale]) {
        parentSlug = generateNativeSlug(packagesPage.title[locale]);
      }

      return `${baseUrl}/${locale}/${parentSlug}/${localeSlug}`;
    },
    languages,
  };
}

/**
 * Generate localized URL paths for location pages with dynamic slug
 */
export async function getLocationLocalizedPaths(
  slug: string,
  baseUrl = "https://istanbulphotosession.com.tr",
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

    let parentSlug = locationsPage?.slug || "locations";
    if (locationsPage?.title?.[l]) {
      parentSlug = generateNativeSlug(locationsPage.title[l]);
    }

    languages[l] = `${baseUrl}/${l}/${parentSlug}/${localeSlug}`;
  });

  // Add x-default pointing to English version
  const defaultParent = locationsPage?.title?.en ? generateNativeSlug(locationsPage.title.en) : "locations";
  languages["x-default"] = languages["en"] || `${baseUrl}/en/${defaultParent}/${slug}`;

  return {
    canonical: (locale: string) => {
      let localeSlug = slug;
      if (activeLocation?.title?.[locale]) {
        localeSlug = generateNativeSlug(activeLocation.title[locale]);
      } else if (activeLocation?.slug) {
        localeSlug = activeLocation.slug;
      }

      let parentSlug = locationsPage?.slug || "locations";
      if (locationsPage?.title?.[locale]) {
        parentSlug = generateNativeSlug(locationsPage.title[locale]);
      }

      return `${baseUrl}/${locale}/${parentSlug}/${localeSlug}`;
    },
    languages,
  };
}

/**
 * Generate localized URL paths for print product pages with dynamic slug
 */
export function getPrintLocalizedPaths(
  slug: string,
  baseUrl = "https://istanbulphotosession.com.tr",
): {
  canonical: (locale: string) => string;
  languages: Record<string, string>;
} {
  const printsPathConfig = routing.pathnames["/prints/[slug]"];

  // Build language alternates for prints with x-default
  const languages: Record<string, string> = {};
  routing.locales.forEach((l: string) => {
    let localizedPrintsPath = `/prints/${slug}`;
    if (
      typeof printsPathConfig === "object" &&
      printsPathConfig !== null &&
      l in printsPathConfig
    ) {
      localizedPrintsPath = (printsPathConfig as Record<string, string>)[
        l
      ].replace("[slug]", slug);
    }
    languages[l] = `${baseUrl}/${l}${localizedPrintsPath}`;
  });

  // Add x-default pointing to English version
  languages["x-default"] = languages["en"];

  return {
    canonical: (locale: string) => {
      let localizedPrintsPath = `/prints/${slug}`;
      if (
        typeof printsPathConfig === "object" &&
        printsPathConfig !== null &&
        locale in printsPathConfig
      ) {
        localizedPrintsPath = (printsPathConfig as Record<string, string>)[
          locale
        ].replace("[slug]", slug);
      }
      return `${baseUrl}/${locale}${localizedPrintsPath}`;
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
  baseUrl = "https://istanbulphotosession.com.tr",
) {
  const paths = getLocalizedPaths(pathname, baseUrl);
  return paths.canonical(locale);
}

export async function getPackageOpenGraphUrl(
  slug: string,
  locale: string,
  baseUrl = "https://istanbulphotosession.com.tr",
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
  baseUrl = "https://istanbulphotosession.com.tr",
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
    languages[l] = `${baseUrl}/${l}/${localeSlug}`;
  });

  // Add x-default pointing to English version
  languages["x-default"] = languages["en"] || `${baseUrl}/en/${internalSlug}`;

  return {
    canonical: (locale: string) => {
      let localeSlug = internalSlug;
      if (titleObj?.[locale]) {
        localeSlug = generateNativeSlug(titleObj[locale] as string);
      }
      return `${baseUrl}/${locale}/${localeSlug}`;
    },
    languages,
  };
}
