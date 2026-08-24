import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { locationsService } from "@/lib/locations-service";
import { packagesService } from "@/lib/packages-service";
import { pagesContentService } from "@/lib/pages-content-service";
import { getBaseUrl } from "@/lib/seo-utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const locales = routing.locales;

  const getAlternates = (pathResolver: (locale: string) => string) => {
    const languages: Record<string, string> = {};
    locales.forEach((loc) => {
      languages[loc] = encodeURI(`${baseUrl}/${loc}${pathResolver(loc)}`);
    });
    // Fallback for unmatched languages
    languages["x-default"] = encodeURI(`${baseUrl}/en${pathResolver("en")}`);
    return { languages };
  };

  const sitemapData: MetadataRoute.Sitemap = [];
  const { generateNativeSlug } = await import("@/lib/slug-generator");

  const cleanImage = (url?: string | null) => {
    if (!url) return "";
    return url.replace(
      "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public",
      `${baseUrl}/storage`,
    );
  };

  // 1. Root Domain (x-default fallback)
  sitemapData.push({
    url: encodeURI(`${baseUrl}/`),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
    alternates: getAlternates(() => ""),
  });

  // 2. Home Pages (All Locales)
  locales.forEach((locale) => {
    sitemapData.push({
      url: encodeURI(`${baseUrl}/${locale}`),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: getAlternates(() => ""),
    });
  });

  // 2. Core Dynamic Pages from PagesContentService
  const corePages = await pagesContentService.getAllPages();
  const activeCorePages = corePages.filter(
    (p) => p.is_active && !p.slug.includes("home-"),
  );

  for (const page of activeCorePages) {
    if (page.slug === "home") continue;

    locales.forEach((locale) => {
      const titleLoc = page.title?.[locale];
      const pageSeg = titleLoc
        ? `/${generateNativeSlug(titleLoc)}`
        : `/${page.slug}`;

      sitemapData.push({
        url: encodeURI(`${baseUrl}/${locale}${pageSeg}`),
        lastModified: new Date(
          page.updated_at || page.created_at || new Date(),
        ),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: getAlternates((loc) => {
          const tLoc = page.title?.[loc];
          return tLoc ? `/${generateNativeSlug(tLoc)}` : `/${page.slug}`;
        }),
        ...(page.cover_image ? { images: [cleanImage(page.cover_image)] } : {}),
      });
    });
  }

  // 3. Packages
  const activePackages = await packagesService.getActivePackages();
  const packagesParent = corePages.find((p) => p.slug === "packages");

  for (const pkg of activePackages) {
    locales.forEach((locale) => {
      const pTitle = packagesParent?.title?.[locale];
      const pSeg = pTitle ? generateNativeSlug(pTitle) : "packages";
      const pkgTitleLoc = pkg.title?.[locale];
      const pkgSeg = pkgTitleLoc
        ? generateNativeSlug(pkgTitleLoc) || pkg.slug
        : pkg.slug;

      sitemapData.push({
        url: encodeURI(`${baseUrl}/${locale}/${pSeg}/${pkgSeg}`),
        lastModified: new Date(pkg.updated_at || pkg.created_at || new Date()),
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: getAlternates((loc) => {
          const tTitle = packagesParent?.title?.[loc];
          const tSeg = tTitle ? generateNativeSlug(tTitle) : "packages";
          const tPkgTitle = pkg.title?.[loc];
          const tPkgSeg = tPkgTitle
            ? generateNativeSlug(tPkgTitle) || pkg.slug
            : pkg.slug;
          return `/${tSeg}/${tPkgSeg}`;
        }),
        ...(pkg.gallery_images && pkg.gallery_images.length > 0
          ? { images: [cleanImage(pkg.gallery_images[0])] }
          : {}),
      });
    });
  }

  // 4. Locations
  const activeLocations = await locationsService.getLocations();
  const locationsParent = corePages.find((p) => p.slug === "locations");

  for (const locItem of activeLocations) {
    locales.forEach((locale) => {
      const pTitle = locationsParent?.title?.[locale];
      const pSeg = pTitle ? generateNativeSlug(pTitle) : "locations";
      const locTitleLoc = locItem.title?.[locale];
      const locSeg = locTitleLoc
        ? generateNativeSlug(locTitleLoc) || locItem.slug
        : locItem.slug;

      sitemapData.push({
        url: encodeURI(`${baseUrl}/${locale}/${pSeg}/${locSeg}`),
        lastModified: new Date(
          locItem.updated_at || locItem.created_at || new Date(),
        ),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: getAlternates((loc) => {
          const tTitle = locationsParent?.title?.[loc];
          const tSeg = tTitle ? generateNativeSlug(tTitle) : "locations";
          const tLocTitle = locItem.title?.[loc];
          const tLocSeg = tLocTitle
            ? generateNativeSlug(tLocTitle) || locItem.slug
            : locItem.slug;
          return `/${tSeg}/${tLocSeg}`;
        }),
        ...(locItem.cover_image
          ? { images: [cleanImage(locItem.cover_image)] }
          : {}),
      });
    });
  }

  // 5. Blog Posts
  const { supabaseAdmin } = await import("@/lib/supabase");
  if (supabaseAdmin) {
    const { data: blogPosts } = await supabaseAdmin
      .from("blog_posts")
      .select("id, updated_at, created_at, status, featured_image")
      .eq("status", "published");

    if (blogPosts && blogPosts.length > 0) {
      const blogParent = corePages.find((p) => p.slug === "blog");
      const { data: translations } = await supabaseAdmin
        .from("blog_post_translations")
        .select("post_id, locale, slug");

      for (const bp of blogPosts) {
        const postTranslations =
          translations?.filter((t: any) => t.post_id === bp.id) || [];
        if (postTranslations.length === 0) continue;

        const translatedLocales = postTranslations.map((t: any) => t.locale);

        translatedLocales.forEach((locale: string) => {
          const tSlug = postTranslations.find(
            (t: any) => t.locale === locale,
          )?.slug;
          if (!tSlug) return;

          const pTitle = blogParent?.title?.[locale];
          const pSeg = pTitle ? generateNativeSlug(pTitle) : "blog";

          // Calculate custom alternates for this specific post
          const postAlternates: Record<string, string> = {};
          translatedLocales.forEach((loc: string) => {
            const bTitle = blogParent?.title?.[loc];
            const bSeg = bTitle ? generateNativeSlug(bTitle) : "blog";
            const bSlug = postTranslations.find(
              (t: any) => t.locale === loc,
            )?.slug;
            if (bSlug) {
              postAlternates[loc] = encodeURI(
                `${baseUrl}/${loc}/${bSeg}/${bSlug}`,
              );
            }
          });

          // Set x-default to en if exists, otherwise first available
          if (postAlternates["en"]) {
            postAlternates["x-default"] = postAlternates["en"];
          } else if (translatedLocales.length > 0) {
            const firstLoc = translatedLocales[0];
            postAlternates["x-default"] = postAlternates[firstLoc];
          }

          sitemapData.push({
            url: encodeURI(`${baseUrl}/${locale}/${pSeg}/${tSlug}`),
            lastModified: new Date(
              bp.updated_at || bp.created_at || new Date(),
            ),
            changeFrequency: "monthly",
            priority: 0.6,
            alternates: { languages: postAlternates },
            ...(bp.featured_image
              ? { images: [cleanImage(bp.featured_image)] }
              : {}),
          });
        });
      }

      // 6. Blog Categories
      const { data: blogCategories } = await supabaseAdmin
        .from("blog_categories")
        .select(
          "id, slug, updated_at, created_at, translations:blog_category_translations(locale, name)",
        );
      if (blogCategories && blogCategories.length > 0) {
        for (const bc of blogCategories) {
          const catTranslations = bc.translations || [];
          if (catTranslations.length === 0) continue;

          const translatedLocales = catTranslations.map((t: any) => t.locale);

          translatedLocales.forEach((locale: string) => {
            const pTitle = blogParent?.title?.[locale];
            const pSeg = pTitle ? generateNativeSlug(pTitle) : "blog";

            // Alternates
            const catAlternates: Record<string, string> = {};
            translatedLocales.forEach((loc: string) => {
              const bTitle = blogParent?.title?.[loc];
              const bSeg = bTitle ? generateNativeSlug(bTitle) : "blog";
              catAlternates[loc] = encodeURI(
                `${baseUrl}/${loc}/${bSeg}/category/${bc.slug}`,
              );
            });
            if (catAlternates["en"])
              catAlternates["x-default"] = catAlternates["en"];
            else if (translatedLocales.length > 0)
              catAlternates["x-default"] = catAlternates[translatedLocales[0]];

            sitemapData.push({
              url: encodeURI(
                `${baseUrl}/${locale}/${pSeg}/category/${bc.slug}`,
              ),
              lastModified: new Date(
                bc.updated_at || bc.created_at || new Date(),
              ),
              changeFrequency: "weekly",
              priority: 0.5,
              alternates: { languages: catAlternates },
            });
          });
        }
      }

      // 7. Blog Tags
      const { data: blogTags } = await supabaseAdmin
        .from("blog_tags")
        .select(
          "id, slug, updated_at, created_at, translations:blog_tag_translations(locale, name)",
        );
      if (blogTags && blogTags.length > 0) {
        for (const bt of blogTags) {
          const tagTranslations = bt.translations || [];
          if (tagTranslations.length === 0) continue;

          const translatedLocales = tagTranslations.map((t: any) => t.locale);

          translatedLocales.forEach((locale: string) => {
            const pTitle = blogParent?.title?.[locale];
            const pSeg = pTitle ? generateNativeSlug(pTitle) : "blog";

            // Alternates
            const tagAlternates: Record<string, string> = {};
            translatedLocales.forEach((loc: string) => {
              const bTitle = blogParent?.title?.[loc];
              const bSeg = bTitle ? generateNativeSlug(bTitle) : "blog";
              tagAlternates[loc] = encodeURI(
                `${baseUrl}/${loc}/${bSeg}/tag/${bt.slug}`,
              );
            });
            if (tagAlternates["en"])
              tagAlternates["x-default"] = tagAlternates["en"];
            else if (translatedLocales.length > 0)
              tagAlternates["x-default"] = tagAlternates[translatedLocales[0]];

            sitemapData.push({
              url: encodeURI(`${baseUrl}/${locale}/${pSeg}/tag/${bt.slug}`),
              lastModified: new Date(
                bt.updated_at || bt.created_at || new Date(),
              ),
              changeFrequency: "weekly",
              priority: 0.4,
              alternates: { languages: tagAlternates },
            });
          });
        }
      }
    }
  }

  return sitemapData;
}
