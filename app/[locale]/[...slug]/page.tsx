import { notFound } from "next/navigation";
import { pagesContentService } from "@/lib/pages-content-service";

import { AboutPageContent } from "./about-content";
import { ContactPageContent } from "./contact-content";
import { PrivacyPageContent } from "./privacy-content";
import { PackagesPageContent } from "./packages-content";
import { LocationsPageContent } from "./locations-content";
import { BlogPageContent } from "./blog-content";

import { LocationDetailPageContent } from "./location-detail-content";
import { PackageDetailPageContent } from "./package-detail-content";
import { BlogDetailPageContent } from "./blog-detail-content";
import { BlogCategoryContent } from "./blog-category-content";

import { Metadata } from "next";
import { generateSeoDescription, generateSeoTitle, constructOpenGraph, getBaseUrl, optimizeSeoImage } from "@/lib/seo-utils";
import { packagesService } from "@/lib/packages-service";
import { locationsService } from "@/lib/locations-service";
import { getBlogCategoryBySlug, getBlogPostBySlug, getBlogTagBySlug } from "@/lib/blog/blog-service";

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { routing } = await import("@/i18n/routing");

  if (!routing.locales.includes(params.locale as any)) {
    notFound();
    return {};
  }

  const slugArray = params.slug || [];
  const rootSlug = slugArray[0];
  const { settingsService } = await import("@/lib/settings-service");

  const [settings, dbPage] = await Promise.all([
    settingsService.getSettings(),
    pagesContentService.getPageBySlug(rootSlug)
  ]);

  const fallbackTitle = settings.site_name || "";
  if (!dbPage || !dbPage.is_active) {
    notFound();
    return {};
  }


  const { getBaseUrl } = await import("@/lib/seo-utils");
  const { generateNativeSlug } = await import("@/lib/slug-generator");
  const baseUrl = getBaseUrl();
  const getAlternates = (resolver: (loc: string) => string) => {
    const langs: Record<string, string> = {};
    routing.locales.forEach((loc) => {
      langs[loc] = `${baseUrl}/${loc}${resolver(loc)}`;
    });
    langs["x-default"] = `${baseUrl}/en${resolver("en")}`;
    return { languages: langs };
  };

  // Level 1: Root Pages (e.g. /about, /locations, /packages)
  if (slugArray.length === 1) {
    const title = generateSeoTitle(dbPage.title?.[params.locale] || dbPage.title?.en, params.locale, fallbackTitle);
    const desc = generateSeoDescription(dbPage.subtitle?.[params.locale] || dbPage.subtitle?.en) || "";
    let ogImage = dbPage.cover_image || settings.default_og_image_url || "";

    // If it's the packages page and no cover image is explicitly defined, fallback to the first active package's image
    if (dbPage.slug === "packages" && !dbPage.cover_image) {
      const activePackages = await packagesService.getActivePackages();
      if (activePackages && activePackages.length > 0 && activePackages[0].cover_image) {
        ogImage = activePackages[0].cover_image;
      }
    }
    const currentSeg = dbPage.title?.[params.locale] ? generateNativeSlug(dbPage.title[params.locale]!) : dbPage.slug;

    return {
      title,
      description: desc,
      alternates: {
        canonical: `${baseUrl}/${params.locale}/${currentSeg}`,
        ...getAlternates((loc) => {
          const tLoc = dbPage.title?.[loc];
          return `/${tLoc ? generateNativeSlug(tLoc) : dbPage.slug}`;
        }),
      },
      openGraph: constructOpenGraph(title, desc, ogImage, fallbackTitle, params.locale),
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: ogImage ? [optimizeSeoImage(ogImage, 1200)] : [],
      },
    };
  }

  // Level 3: Deep nested pages (e.g. /blog/category/fotografcilik)
  if (slugArray.length === 3 && dbPage?.slug === "blog") {
    const type = slugArray[1]; // category or tag
    const childSlug = slugArray[2];

    let dynamicTitle = "";
    let dynamicDesc = "";

    if (type === "category") {
      const category = await getBlogCategoryBySlug(childSlug, params.locale as any);
      if (category) {
        dynamicTitle = category.translation?.name || category.slug;
        dynamicDesc = category.translation?.description || "";
      }
    } else if (type === "tag") {
      const tag = await getBlogTagBySlug(childSlug, params.locale as any);
      if (tag) {
        dynamicTitle = tag.translation?.name || tag.slug;
      }
    } else {
      notFound();
      return {};
    }

    const title = generateSeoTitle(dynamicTitle, params.locale, fallbackTitle);
    const desc = generateSeoDescription(dynamicDesc);

    return {
      title,
      description: desc,
      alternates: {
        canonical: `${baseUrl}/${params.locale}/${dbPage.slug}/${type}/${childSlug}`,
        ...getAlternates((loc) => {
          const tLoc = dbPage.title?.[loc];
          const bSeg = tLoc ? generateNativeSlug(tLoc) : dbPage.slug;
          return `/${bSeg}/${type}/${childSlug}`;
        }),
      },
      openGraph: constructOpenGraph(title, desc, settings.default_og_image_url || "", fallbackTitle, params.locale),
      twitter: {
        card: "summary_large_image",
        title,
        description: desc,
        images: settings.default_og_image_url ? [optimizeSeoImage(settings.default_og_image_url, 1200)] : [],
      },
    };
  }

  // Level 2: Detail pages
  if (slugArray.length === 2) {
    const childSlug = slugArray[1];
    let dynamicTitle = fallbackTitle;
    let dynamicDesc = "";
    let ogImage = settings.default_og_image_url || "";
    let publishedTime: string | undefined;
    let modifiedTime: string | undefined;
    let authors: string[] | undefined;
    let keywords: string[] = [];

    // Default alternate resolver fallback
    let getAlternatesFn = (loc: string) => {
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
      dynamicDesc = pkg.meta_description?.[params.locale] || pkg.meta_description?.en || pkg.description?.[params.locale] || pkg.description?.en || "";
      ogImage = (pkg.gallery_images && pkg.gallery_images.length > 0) ? pkg.gallery_images[0] : ogImage;
      keywords = pkg.meta_keywords?.[params.locale] || pkg.meta_keywords?.en || (pkg as any).meta_keywords || [];
      getAlternatesFn = (loc: string) => {
        const pTitle = dbPage.title?.[loc];
        const pSeg = pTitle ? generateNativeSlug(pTitle) : "packages";
        const pkgTitle = pkg.title?.[loc];
        const pkgSeg = pkgTitle ? (generateNativeSlug(pkgTitle) || pkg.slug) : pkg.slug;
        return `/${pSeg}/${pkgSeg}`;
      };
    } else if (dbPage.slug === "locations") {
      const locItem = await locationsService.getLocationBySlug(childSlug);
      if (!locItem) {
        notFound();
        return {};
      }
      dynamicTitle = locItem.title?.[params.locale] || locItem.title?.en || "";
      dynamicDesc = locItem.description?.[params.locale] || locItem.description?.en || "";
      ogImage = locItem.cover_image || (locItem.gallery_images && locItem.gallery_images.length > 0 ? locItem.gallery_images[0] : ogImage);
      keywords = (locItem as any).meta_keywords || [];
      getAlternatesFn = (loc: string) => {
        const pTitle = dbPage.title?.[loc];
        const pSeg = pTitle ? generateNativeSlug(pTitle) : "locations";
        const locTitle = locItem.title?.[loc];
        const locSeg = locTitle ? (generateNativeSlug(locTitle) || locItem.slug) : locItem.slug;
        return `/${pSeg}/${locSeg}`;
      };
    } else if (dbPage.slug === "blog") {
      const { getBlogPostBySlug, getBlogPostByIdWithAllTranslations } = await import("@/lib/blog/blog-service");
      const post = await getBlogPostBySlug(childSlug, params.locale as any);
      if (post) {
        dynamicTitle = post.translation.title;
        dynamicDesc = post.translation.meta_description || post.translation.excerpt || post.translation.content;
        ogImage = post.featured_image || ogImage;
        publishedTime = post.published_at || post.created_at;
        modifiedTime = post.updated_at;
        keywords = post.translation.meta_keywords || [];
        if (post.author?.name) {
          authors = [post.author.name];
        }
        const fullPost = await getBlogPostByIdWithAllTranslations(post.id);
        if (fullPost && fullPost.translations) {
          getAlternatesFn = (loc: string) => {
            const pTitle = dbPage.title?.[loc];
            const pSeg = pTitle ? generateNativeSlug(pTitle) : "blog";
            const tSlug = (fullPost.translations as any)[loc]?.slug || (fullPost.translations as any).en?.slug || post.translation.slug;
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

    const currentSeg = dbPage.title?.[params.locale] ? generateNativeSlug(dbPage.title[params.locale]!) : dbPage.slug;

    return {
      title,
      description: desc,
      keywords: keywords.length > 0 ? keywords : undefined,
      alternates: {
        canonical: `${baseUrl}/${params.locale}${getAlternatesFn(params.locale)}`,
        ...getAlternates(getAlternatesFn),
      },
      openGraph: constructOpenGraph(title, desc, ogImage, fallbackTitle, params.locale, dbPage.slug === "blog" ? {
        type: "article",
        publishedTime,
        modifiedTime,
        authors,
        tags: keywords.length > 0 ? keywords : undefined
      } : {}),
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

  // Level 3+ Deep nested pages
  if (slugArray.length > 2) {
    if (slugArray.length === 3 && dbPage?.slug === "blog") {
      const type = slugArray[1];
      if (type === "category" || type === "tag") {
        return (
          <BlogCategoryContent 
            params={props.params as any} 
            searchParams={props.searchParams as any}
            type={type as any}
            slug={slugArray[2]} 
          />
        );
      }
    }
    notFound(); // Max depth supported is 3
  }

  if (!dbPage || !dbPage.is_active) {
    notFound();
  }

  // Level 1 Handling
  if (slugArray.length === 1) {
    switch (dbPage.slug) {
      case "about": return <AboutPageContent params={Promise.resolve({ locale: params.locale, slug: rootSlug })} />;
      case "packages": return <PackagesPageContent params={Promise.resolve({ locale: params.locale, slug: rootSlug })} />;
      case "locations": return <LocationsPageContent params={{ locale: params.locale, slug: rootSlug }} />;
      case "blog": return <BlogPageContent params={Promise.resolve({ locale: params.locale, slug: rootSlug }) as any} searchParams={props.searchParams as any} />;
      case "contact": return <ContactPageContent params={Promise.resolve({ locale: params.locale, slug: rootSlug })} />;
      case "privacy": return <PrivacyPageContent params={Promise.resolve({ locale: params.locale, slug: rootSlug })} />;
      default: notFound();
    }
  }

  // Level 2 Handling (Children dynamic routing!)
  if (slugArray.length === 2) {
    const childSlug = slugArray[1];

    switch (dbPage.slug) {
      case "locations":
        return <LocationDetailPageContent locale={params.locale} slug={childSlug} parentSlug={rootSlug} />;
      case "packages":
        return <PackageDetailPageContent locale={params.locale} slug={childSlug} parentSlug={rootSlug} />;
      case "blog":
        return <BlogDetailPageContent locale={params.locale} slug={childSlug} parentSlug={rootSlug} />;
      // Additional depth structures could be added here in the future
      default:
        notFound();
    }
  }

  notFound();
}
