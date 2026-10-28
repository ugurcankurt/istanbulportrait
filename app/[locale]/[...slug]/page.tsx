import { notFound, permanentRedirect } from "next/navigation";
import { pagesContentService } from "@/lib/pages-content-service";

export const revalidate = 60;

import type { Metadata } from "next";
import {
  getBlogCategoryBySlug,
  getBlogTagBySlug,
} from "@/lib/blog/blog-service";
import { locationsService } from "@/lib/locations-service";
import { packagesService } from "@/lib/packages-service";
import {
  constructOpenGraph,
  generateSeoDescription,
  generateSeoTitle,
  optimizeSeoImage,
} from "@/lib/seo-utils";
import { AboutPageContent } from "./about-content";
import { BlogCategoryContent } from "./blog-category-content";
import { BlogPageContent } from "./blog-content";
import { BlogDetailPageContent } from "./blog-detail-content";
import { ContactPageContent } from "./contact-content";
import { LocationDetailPageContent } from "./location-detail-content";
import { LocationsPageContent } from "./locations-content";
import { PackageDetailPageContent } from "./package-detail-content";
import { PackagesPageContent } from "./packages-content";
import { PrivacyPageContent } from "./privacy-content";

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const rawPage = Array.isArray(searchParams?.page)
    ? searchParams.page[0]
    : searchParams?.page;
  const pageNum = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);
  const pageQuerySuffix = pageNum > 1 ? `?page=${pageNum}` : "";
  const { routing } = await import("@/i18n/routing");

  // biome-ignore lint/suspicious/noExplicitAny: Routing locale matching
  if (!routing.locales.includes(params.locale as any)) {
    notFound();
    return {};
  }

  const slugArray = params.slug || [];
  const rootSlug = slugArray[0];
  const { settingsService } = await import("@/lib/settings-service");

  const [settings, dbPage] = await Promise.all([
    settingsService.getSettings(),
    pagesContentService.getPageBySlug(rootSlug),
  ]);

  const fallbackTitle = settings.site_name || "";
  if (!dbPage?.is_active) {
    notFound();
    return {};
  }

  const { getBaseUrl } = await import("@/lib/seo-utils");
  const { generateNativeSlug } = await import("@/lib/slug-generator");
  const baseUrl = getBaseUrl();
  const getAlternates = (resolver: (loc: string) => string | null) => {
    const langs: Record<string, string> = {};
    routing.locales.forEach((loc) => {
      const resolved = resolver(loc);
      if (resolved) {
        langs[loc] = encodeURI(`${baseUrl}/${loc}${resolved}`);
      }
    });
    const enResolved = resolver("en");
    if (enResolved) {
      langs["x-default"] = encodeURI(`${baseUrl}/en${enResolved}`);
    } else {
      const availableLocales = Object.keys(langs);
      if (availableLocales.length > 0) {
        langs["x-default"] = langs[availableLocales[0]];
      }
    }
    return { languages: langs };
  };

  // Level 1: Root Pages (e.g. /about, /locations, /packages)
  if (slugArray.length === 1) {
    const title = generateSeoTitle(
      dbPage.title?.[params.locale] || dbPage.title?.en,
      params.locale,
      fallbackTitle,
    );
    const desc = generateSeoDescription(
      dbPage.subtitle?.[params.locale] || dbPage.subtitle?.en,
    );
    let ogImage = dbPage.cover_image || settings.default_og_image_url || "";

    // If it's the packages page and no cover image is explicitly defined, fallback to the first active package's image
    if (dbPage.slug === "packages" && !dbPage.cover_image) {
      const activePackages = await packagesService.getActivePackages();
      if (
        activePackages &&
        activePackages.length > 0 &&
        activePackages[0].cover_image
      ) {
        ogImage = activePackages[0].cover_image;
      }
    }
    const currentSeg = dbPage.title?.[params.locale]
      ? generateNativeSlug(dbPage.title[params.locale] || "")
      : dbPage.slug;
    const isPaginatedBlog = dbPage.slug === "blog" && pageNum > 1;
    const canonicalUrl = `${encodeURI(`${baseUrl}/${params.locale}/${currentSeg}`)}${isPaginatedBlog ? pageQuerySuffix : ""}`;
    const paginatedTitle = isPaginatedBlog ? `${title} - ${pageNum}` : title;

    return {
      title: paginatedTitle,
      description: desc,
      alternates: {
        canonical: canonicalUrl,
        ...getAlternates((loc) => {
          const tLoc = dbPage.title?.[loc];
          return `/${tLoc ? generateNativeSlug(tLoc) : dbPage.slug}${isPaginatedBlog ? pageQuerySuffix : ""}`;
        }),
      },
      openGraph: constructOpenGraph(
        paginatedTitle,
        desc,
        ogImage,
        fallbackTitle,
        params.locale,
        { url: canonicalUrl },
      ),
      twitter: {
        card: "summary_large_image",
        title: paginatedTitle,
        description: desc,
        images: ogImage ? [optimizeSeoImage(ogImage, 1200)] : [],
      },
    };
  }

  // Level 3: Deep nested pages (e.g. /blog/category/fotografcilik)
  if (slugArray.length === 3 && dbPage?.slug === "blog") {
    const type = slugArray[1]; // category or tag
    let childSlug = slugArray[2];
    try {
      childSlug = decodeURIComponent(childSlug).trim();
    } catch {}

    let dynamicTitle = "";
    let dynamicDesc = "";

    if (type === "category") {
      const category = await getBlogCategoryBySlug(
        childSlug,
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
        params.locale as any,
      );
      if (!category) {
        notFound();
        return {};
      }
      dynamicTitle = category.translation?.name || category.slug;
      dynamicDesc = category.translation?.description || "";
    } else if (type === "tag") {
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
      const tag = await getBlogTagBySlug(childSlug, params.locale as any);
      if (!tag) {
        notFound();
        return {};
      }
      dynamicTitle = tag.translation?.name || tag.slug;
    } else {
      notFound();
      return {};
    }

    const baseTitle = generateSeoTitle(
      dynamicTitle,
      params.locale,
      fallbackTitle,
    );
    const title = pageNum > 1 ? `${baseTitle} - ${pageNum}` : baseTitle;
    const desc = generateSeoDescription(dynamicDesc);
    const blogLocTitle = dbPage.title?.[params.locale];
    const blogSeg = blogLocTitle
      ? generateNativeSlug(blogLocTitle)
      : dbPage.slug;
    const categoryCanonical = `${encodeURI(
      `${baseUrl}/${params.locale}/${blogSeg}/${type}/${childSlug}`,
    )}${pageQuerySuffix}`;

    return {
      title,
      description: desc,
      alternates: {
        canonical: categoryCanonical,
        ...getAlternates((loc) => {
          const tLoc = dbPage.title?.[loc];
          const bSeg = tLoc ? generateNativeSlug(tLoc) : dbPage.slug;
          return `/${bSeg}/${type}/${childSlug}${pageQuerySuffix}`;
        }),
      },
      openGraph: constructOpenGraph(
        title,
        desc,
        settings.default_og_image_url || "",
        fallbackTitle,
        params.locale,
        { url: categoryCanonical },
      ),
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: settings.default_og_image_url
          ? [optimizeSeoImage(settings.default_og_image_url, 1200)]
          : [],
      },
    };
  }

  // Level 2: Detail pages
  if (slugArray.length === 2) {
    let childSlug = slugArray[1];
    try {
      childSlug = decodeURIComponent(childSlug).trim();
    } catch {}
    let dynamicTitle = fallbackTitle;
    let dynamicDesc = "";
    let ogImage = settings.default_og_image_url || "";
    let publishedTime: string | undefined;
    let modifiedTime: string | undefined;
    let authors: string[] | undefined;
    let keywords: string[] = [];

    let getAlternatesFn = (loc: string): string | null => {
      const tLoc = dbPage.title?.[loc];
      return `/${tLoc ? generateNativeSlug(tLoc) : dbPage.slug}/${childSlug}`;
    };

    if (dbPage.slug === "packages") {
      const pkg = await packagesService.getPackageBySlug(childSlug);
      if (!pkg) {
        notFound();
        return {};
      }
      dynamicTitle = pkg.title?.[params.locale] || pkg.title?.en || "";
      dynamicDesc =
        pkg.meta_description?.[params.locale] ||
        pkg.meta_description?.en ||
        pkg.description?.[params.locale] ||
        pkg.description?.en ||
        "";
      ogImage =
        pkg.gallery_images && pkg.gallery_images.length > 0
          ? pkg.gallery_images[0]
          : ogImage;
      keywords =
        pkg.meta_keywords?.[params.locale] ||
        pkg.meta_keywords?.en ||
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
        (pkg as any).meta_keywords ||
        [];
      getAlternatesFn = (loc: string) => {
        const pTitle = dbPage.title?.[loc];
        const pSeg = pTitle ? generateNativeSlug(pTitle) : "packages";
        const pkgTitle = pkg.title?.[loc];
        const pkgSeg = pkgTitle
          ? generateNativeSlug(pkgTitle) || pkg.slug
          : pkg.slug;
        return `/${pSeg}/${pkgSeg}`;
      };
    } else if (dbPage.slug === "locations") {
      const locItem = await locationsService.getLocationBySlug(childSlug);
      if (!locItem) {
        notFound();
        return {};
      }
      dynamicTitle = locItem.title?.[params.locale] || locItem.title?.en || "";
      dynamicDesc =
        locItem.description?.[params.locale] || locItem.description?.en || "";
      ogImage =
        locItem.cover_image ||
        (locItem.gallery_images && locItem.gallery_images.length > 0
          ? locItem.gallery_images[0]
          : ogImage);
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
      keywords = (locItem as any).meta_keywords || [];
      getAlternatesFn = (loc: string) => {
        const pTitle = dbPage.title?.[loc];
        const pSeg = pTitle ? generateNativeSlug(pTitle) : "locations";
        const locTitle = locItem.title?.[loc];
        const locSeg = locTitle
          ? generateNativeSlug(locTitle) || locItem.slug
          : locItem.slug;
        return `/${pSeg}/${locSeg}`;
      };
    } else if (dbPage.slug === "blog") {
      const { getBlogPostBySlug, getBlogPostByIdWithAllTranslations } =
        await import("@/lib/blog/blog-service");
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
      const post = await getBlogPostBySlug(childSlug, params.locale as any);
      if (post) {
        dynamicTitle = post.translation.title;
        dynamicDesc =
          post.translation.meta_description ||
          post.translation.excerpt ||
          post.translation.content;
        ogImage = post.featured_image || ogImage;
        publishedTime = post.published_at || post.created_at;
        modifiedTime = post.updated_at;
        keywords = post.translation.meta_keywords || [];
        if (post.author?.name) {
          authors = [post.author.name];
        }
        const fullPost = await getBlogPostByIdWithAllTranslations(post.id);
        if (fullPost?.translations) {
          getAlternatesFn = (loc: string) => {
            const pTitle = dbPage.title?.[loc];
            const pSeg = pTitle ? generateNativeSlug(pTitle) : "blog";
            // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
            const locTranslation = (fullPost.translations as any)[loc];
            if (!locTranslation) return null;

            const tSlug = locTranslation.slug;
            return `/${pSeg}/${tSlug}`;
          };
        }
      } else {
        notFound();
        return {};
      }
    }

    const title = generateSeoTitle(dynamicTitle, params.locale, fallbackTitle);
    const desc = generateSeoDescription(dynamicDesc);

    const _currentSeg = dbPage.title?.[params.locale]
      ? generateNativeSlug(dbPage.title[params.locale] || "")
      : dbPage.slug;
    const currentPath = getAlternatesFn(params.locale);
    const detailCanonical = currentPath
      ? encodeURI(`${baseUrl}/${params.locale}${currentPath}`)
      : encodeURI(`${baseUrl}/${params.locale}/${rootSlug}/${childSlug}`);

    return {
      title,
      description: desc,
      keywords: keywords.length > 0 ? keywords : undefined,
      alternates: {
        ...(getAlternatesFn(params.locale)
          ? {
              canonical: encodeURI(
                `${baseUrl}/${params.locale}${getAlternatesFn(params.locale)}`,
              ),
            }
          : {}),
        ...getAlternates(getAlternatesFn),
      },
      openGraph: constructOpenGraph(
        title,
        desc,
        ogImage,
        fallbackTitle,
        params.locale,
        dbPage.slug === "blog"
          ? {
              url: detailCanonical,
              type: "article",
              publishedTime,
              modifiedTime,
              authors,
              tags: keywords.length > 0 ? keywords : undefined,
            }
          : { url: detailCanonical },
      ),
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: ogImage ? [optimizeSeoImage(ogImage, 1200)] : [],
      },
    };
  }

  return { title: fallbackTitle || "Website" };
}

export default async function GenericCorePage(props: {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const slugArray = params.slug || [];

  const rootSlug = slugArray[0];
  const dbPage = await pagesContentService.getPageBySlug(rootSlug);

  // Canonical redirect: any slug that belongs to another locale (or differs
  // in casing/encoding) is permanently redirected to this locale's canonical URL.
  if (dbPage?.is_active && slugArray.length >= 1 && slugArray.length <= 3) {
    const { generateNativeSlug } = await import("@/lib/slug-generator");
    const normalize = (s: string) => {
      try {
        return decodeURIComponent(s).trim().toLowerCase();
      } catch {
        return s.toLowerCase();
      }
    };

    const localizedTitle = dbPage.title?.[params.locale];
    const expectedRoot = localizedTitle
      ? generateNativeSlug(localizedTitle) || dbPage.slug
      : dbPage.slug;

    const expectedSegments = [expectedRoot];
    let resolvable = true;

    if (slugArray.length >= 2) {
      let expectedChild = normalize(slugArray[1]);
      if (slugArray.length === 2 && dbPage.slug === "packages") {
        const pkg = await packagesService.getPackageBySlug(slugArray[1]);
        if (pkg) {
          const t = pkg.title?.[params.locale];
          expectedChild = t ? generateNativeSlug(t) || pkg.slug : pkg.slug;
        } else {
          resolvable = false;
        }
      } else if (slugArray.length === 2 && dbPage.slug === "locations") {
        const loc = await locationsService.getLocationBySlug(slugArray[1]);
        if (loc) {
          const t = loc.title?.[params.locale];
          expectedChild = t ? generateNativeSlug(t) || loc.slug : loc.slug;
        } else {
          resolvable = false;
        }
      } else if (slugArray.length === 2 && dbPage.slug === "blog") {
        const { getBlogPostBySlug } = await import("@/lib/blog/blog-service");
        const post = await getBlogPostBySlug(
          slugArray[1],
          // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
          params.locale as any,
        );
        if (post?.translation?.slug) {
          expectedChild = post.translation.slug;
        } else {
          resolvable = false;
        }
      }
      expectedSegments.push(expectedChild);
      if (slugArray.length === 3) {
        expectedSegments.push(normalize(slugArray[2]));
      }
    }

    const matches =
      slugArray.length === expectedSegments.length &&
      slugArray.every(
        (seg, i) => normalize(seg) === expectedSegments[i].toLowerCase(),
      );

    if (resolvable && !matches) {
      const sp = await props.searchParams;
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(sp || {})) {
        if (Array.isArray(value)) {
          for (const v of value) qs.append(key, v);
        } else if (value !== undefined) {
          qs.set(key, value);
        }
      }
      const query = qs.toString();
      permanentRedirect(
        `${encodeURI(`/${params.locale}/${expectedSegments.join("/")}`)}${query ? `?${query}` : ""}`,
      );
    }
  }

  // Level 3+ Deep nested pages
  if (slugArray.length > 2) {
    if (slugArray.length === 3 && dbPage?.slug === "blog") {
      const type = slugArray[1];
      if (type === "category" || type === "tag") {
        return (
          <BlogCategoryContent
            // biome-ignore lint/suspicious/noExplicitAny: Props mismatch
            params={props.params as any}
            // biome-ignore lint/suspicious/noExplicitAny: Props mismatch
            searchParams={props.searchParams as any}
            // biome-ignore lint/suspicious/noExplicitAny: Props mismatch
            type={type as any}
            slug={slugArray[2]}
          />
        );
      }
    }
    notFound(); // Max depth supported is 3
  }

  if (!dbPage?.is_active) {
    notFound();
  }

  // Level 1 Handling
  if (slugArray.length === 1) {
    switch (dbPage.slug) {
      case "about":
        return (
          <AboutPageContent
            params={Promise.resolve({ locale: params.locale, slug: rootSlug })}
          />
        );
      case "packages":
        return (
          <PackagesPageContent
            params={Promise.resolve({ locale: params.locale, slug: rootSlug })}
          />
        );
      case "locations":
        return (
          <LocationsPageContent
            params={{ locale: params.locale, slug: rootSlug }}
          />
        );
      case "blog":
        return (
          <BlogPageContent
            params={
              // biome-ignore lint/suspicious/noExplicitAny: Props mismatch
              Promise.resolve({ locale: params.locale, slug: rootSlug }) as any
            }
            // biome-ignore lint/suspicious/noExplicitAny: Props mismatch
            searchParams={props.searchParams as any}
          />
        );
      case "contact":
        return (
          <ContactPageContent
            params={Promise.resolve({ locale: params.locale, slug: rootSlug })}
          />
        );
      case "privacy":
        return (
          <PrivacyPageContent
            params={Promise.resolve({ locale: params.locale, slug: rootSlug })}
          />
        );
      default:
        notFound();
    }
  }

  // Level 2 Handling (Children dynamic routing!)
  if (slugArray.length === 2) {
    const childSlug = slugArray[1];

    switch (dbPage.slug) {
      case "locations":
        return (
          <LocationDetailPageContent
            locale={params.locale}
            slug={childSlug}
            parentSlug={rootSlug}
          />
        );
      case "packages":
        return (
          <PackageDetailPageContent
            locale={params.locale}
            slug={childSlug}
            parentSlug={rootSlug}
          />
        );
      case "blog":
        return (
          <BlogDetailPageContent
            locale={params.locale}
            slug={childSlug}
            parentSlug={rootSlug}
          />
        );
      // Additional depth structures could be added here in the future
      default:
        notFound();
    }
  }

  notFound();
}
