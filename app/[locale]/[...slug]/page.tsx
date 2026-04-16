import { notFound } from "next/navigation";
import { pagesContentService } from "@/lib/pages-content-service";

import { AboutPageContent } from "./about-content";
import { ContactPageContent } from "./contact-content";
import { PrivacyPageContent } from "./privacy-content";
import { PackagesPageContent } from "./packages-content";
import { LocationsPageContent } from "./locations-content";
import { BlogPageContent } from "./blog-content";

// Detailed Component Imports
import { LocationDetailPageContent } from "./location-detail-content";
import { PackageDetailPageContent } from "./package-detail-content";

import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { generateSeoDescription, generateSeoTitle, constructOpenGraph } from "@/lib/seo-utils";
import { packagesService } from "@/lib/packages-service";
import { locationsService } from "@/lib/locations-service";

export async function generateMetadata(props: { 
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const slugArray = params.slug || [];
  const rootSlug = slugArray[0];
  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();
  const fallbackTitle = settings.site_name || "";


  const dbPage = await pagesContentService.getPageBySlug(rootSlug);
  if (!dbPage || !dbPage.is_active) {
    return { title: "Not Found" };
  }

  const { routing } = await import("@/i18n/routing");
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
    const ogImage = dbPage.cover_image || settings.default_og_image_url || "";
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
    };
  }

  // Level 2: Nested Content Pages (e.g. /packages/solo-portrait, /locations/galata)
  if (slugArray.length === 2) {
    const childSlug = slugArray[1];

    if (dbPage.slug === "packages") {
      const pkg = await packagesService.getPackageBySlug(childSlug);
      if (!pkg) return { title: "Package Not Found" };
      const title = generateSeoTitle(pkg.title?.[params.locale] || pkg.title?.en, params.locale, fallbackTitle);
      const desc = generateSeoDescription(pkg.description?.[params.locale] || pkg.description?.en);
      const ogImage = (pkg.gallery_images && pkg.gallery_images.length > 0) ? pkg.gallery_images[0] : settings.default_og_image_url || "";
      const currentPSeg = dbPage.title?.[params.locale] ? generateNativeSlug(dbPage.title[params.locale]!) : "packages";
      return {
        title,
        description: desc,
        alternates: {
          canonical: `${baseUrl}/${params.locale}/${currentPSeg}/${pkg.slug}`,
          ...getAlternates((l) => {
            const tTitle = dbPage.title?.[l];
            const tSeg = tTitle ? generateNativeSlug(tTitle) : "packages";
            return `/${tSeg}/${pkg.slug}`;
          }),
        },
        openGraph: constructOpenGraph(title, desc, ogImage, fallbackTitle, params.locale),
      };
    }

    if (dbPage.slug === "locations") {
      const loc = await locationsService.getLocationBySlug(childSlug);
      if (!loc) return { title: "Location Not Found" };
      const title = generateSeoTitle(loc.title?.[params.locale] || loc.title?.en, params.locale, fallbackTitle);
      const desc = generateSeoDescription(loc.description?.[params.locale] || loc.description?.en);
      const ogImage = loc.cover_image || (loc.gallery_images && loc.gallery_images.length > 0 ? loc.gallery_images[0] : settings.default_og_image_url || "");
      const currentLSeg = dbPage.title?.[params.locale] ? generateNativeSlug(dbPage.title[params.locale]!) : "locations";
      return {
        title,
        description: desc,
        alternates: {
          canonical: `${baseUrl}/${params.locale}/${currentLSeg}/${loc.slug}`,
          ...getAlternates((l) => {
            const tTitle = dbPage.title?.[l];
            const tSeg = tTitle ? generateNativeSlug(tTitle) : "locations";
            return `/${tSeg}/${loc.slug}`;
          }),
        },
        openGraph: constructOpenGraph(title, desc, ogImage, fallbackTitle, params.locale),
      };
    }
  }

  return { title: fallbackTitle || "Website" };
}

export default async function GenericCorePage(props: { 
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await props.params;
  const slugArray = params.slug || [];

  if (slugArray.length > 2) {
    notFound(); // Max depth supported is 2
  }

  const rootSlug = slugArray[0];
  const dbPage = await pagesContentService.getPageBySlug(rootSlug);

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
      // Additional depth structures (blog) could be added here in the future
      default:
        notFound();
    }
  }

  notFound();
}
