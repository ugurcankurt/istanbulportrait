import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPublishedBlogPostCountsByLocale } from "@/lib/blog/blog-service";
import { getBlogTaxonomySegment } from "@/lib/core-page-slugs";
import { locationsService } from "@/lib/locations-service";
import { packagesService } from "@/lib/packages-service";
import { pagesContentService } from "@/lib/pages-content-service";
import {
  generateSeoDescription,
  getBaseUrl,
  resolveSchemaImage,
} from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";
import { generateNativeSlug } from "@/lib/slug-generator";

export const revalidate = 3600;
const FALLBACK_LASTMOD = new Date("2026-01-01T00:00:00.000Z");

export async function generateSitemaps() {
  return [
    { id: "core" },
    { id: "packages" },
    { id: "locations" },
    { id: "blog-posts" },
    { id: "blog-meta" },
  ];
}

export default async function sitemap({
  id,
}: {
  id: Promise<string> | string;
}): Promise<MetadataRoute.Sitemap> {
  const [resolvedId, settings] = await Promise.all([
    id,
    settingsService.getSettings(),
  ]);
  const baseUrl = getBaseUrl(settings.app_base_url);
  const locales = routing.locales;

  const getAlternates = (
    pathResolver: (locale: string) => string,
    available: readonly string[] = locales,
  ) => {
    const languages: Record<string, string> = {};
    available.forEach((loc) => {
      languages[loc] = encodeURI(`${baseUrl}/${loc}${pathResolver(loc)}`);
    });
    // Fallback for unmatched languages
    const defaultLoc = available.includes("en") ? "en" : available[0];
    if (defaultLoc) {
      languages["x-default"] = languages[defaultLoc];
    }
    return { languages };
  };

  const cleanImage = (url?: string | null): string => resolveSchemaImage(url);

  // Next.js MetadataRoute.Sitemap does not XML-escape video:title / video:description,
  // so raw '&', '<', '>' characters break XML parsing in Google Search Console.
  const escapeXml = (str: string): string =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const sitemapData: MetadataRoute.Sitemap = [];

  if (resolvedId === "core") {
    const corePages = await pagesContentService.getAllPages();
    const homePage = corePages.find((p) => p.slug === "home");
    const homeHero = corePages.find((p) => p.slug === "home-hero");

    // Select the latest updated timestamp between home and home-hero
    const homeUpdatedTime =
      Math.max(
        homePage?.updated_at ? new Date(homePage.updated_at).getTime() : 0,
        homeHero?.updated_at ? new Date(homeHero.updated_at).getTime() : 0,
      ) || new Date("2025-01-01").getTime();
    const homeLastMod = new Date(homeUpdatedTime);

    const homeCover = homePage?.cover_image || homeHero?.cover_image;
    const homeImage = homeCover ? cleanImage(homeCover) : null;

    const activePackages = await packagesService.getActivePackages();
    const packageCoverImages = (activePackages || [])
      .map((p) => cleanImage(p.cover_image))
      .filter(Boolean);

    const homeImages = Array.from(
      new Set([homeImage, ...packageCoverImages].filter(Boolean) as string[]),
    );

    // Root domain is intentionally omitted: it redirects to a locale
    // (redirecting URLs should not be listed in sitemaps).

    // Home Pages (All Locales)
    locales.forEach((locale) => {
      sitemapData.push({
        url: encodeURI(`${baseUrl}/${locale}`),
        lastModified: homeLastMod,
        changeFrequency: "daily",
        priority: 1.0,
        alternates: getAlternates(() => ""),
        ...(homeImages.length > 0 ? { images: homeImages } : {}),
      });
    });

    // 3. Core Dynamic Pages from PagesContentService
    const supportedCoreSlugs = new Set([
      "about",
      "packages",
      "locations",
      "blog",
      "contact",
      "privacy",
    ]);
    const activeCorePages = corePages.filter(
      (p) => p.is_active && supportedCoreSlugs.has(p.slug),
    );

    const blogCountsByLocale = await getPublishedBlogPostCountsByLocale();

    for (const page of activeCorePages) {
      if (page.slug === "home") continue;

      const targetLocales =
        page.slug === "blog"
          ? locales.filter((loc) => (blogCountsByLocale[loc] || 0) > 0)
          : locales;

      targetLocales.forEach((locale) => {
        const pageSeg = `/${pagesContentService.getCorePageSegment(page, locale) || page.slug}`;

        sitemapData.push({
          url: encodeURI(`${baseUrl}/${locale}${pageSeg}`),
          lastModified: new Date(
            page.updated_at || page.created_at || FALLBACK_LASTMOD,
          ),
          changeFrequency: "weekly",
          priority: 0.8,
          alternates: getAlternates(
            (loc) =>
              `/${pagesContentService.getCorePageSegment(page, loc) || page.slug}`,
            targetLocales,
          ),
          ...(page.cover_image
            ? { images: [cleanImage(page.cover_image)] }
            : {}),
        });
      });
    }
  }

  if (resolvedId === "packages") {
    const activePackages = await packagesService.getActivePackages();
    const corePages = await pagesContentService.getAllPages();
    const packagesParent = corePages.find((p) => p.slug === "packages");

    for (const pkg of activePackages) {
      locales.forEach((locale) => {
        const pSeg =
          pagesContentService.getCorePageSegment(
            packagesParent || "packages",
            locale,
          ) || "packages";
        const pkgTitleLoc = pkg.title?.[locale];
        const pkgSeg = pkgTitleLoc
          ? generateNativeSlug(pkgTitleLoc) || pkg.slug
          : pkg.slug;

        // Video logic for Google Video Sitemaps (requires thumbnail_loc AND either content_loc or player_loc)
        const videos: any[] = [];
        if (pkg.video_url) {
          const thumbnail =
            pkg.gallery_images && pkg.gallery_images.length > 0
              ? pkg.gallery_images[0]
              : pkg.cover_image;

          const cleanThumb = cleanImage(thumbnail);
          if (cleanThumb) {
            let playerLoc: string | undefined;
            let contentLoc: string | undefined;

            const ytMatch = pkg.video_url.match(
              /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
            );
            if (ytMatch && ytMatch[1]) {
              playerLoc = `https://www.youtube.com/embed/${ytMatch[1]}`;
            } else {
              contentLoc = cleanImage(pkg.video_url);
            }

            const rawVideoTitle =
              pkg.title?.[locale] || pkg.title?.en || pkg.slug;
            const rawVideoDesc =
              generateSeoDescription(
                pkg.description?.[locale] || pkg.description?.en,
                300,
                locale,
              ) || "Package Video";

            videos.push({
              title: escapeXml(rawVideoTitle),
              thumbnail_loc: escapeXml(cleanThumb),
              description: escapeXml(rawVideoDesc),
              ...(playerLoc ? { player_loc: escapeXml(playerLoc) } : {}),
              ...(contentLoc ? { content_loc: escapeXml(contentLoc) } : {}),
            });
          }
        }

        const packageImages: string[] = [];
        if (pkg.cover_image) {
          packageImages.push(cleanImage(pkg.cover_image));
        }
        if (pkg.gallery_images && pkg.gallery_images.length > 0) {
          pkg.gallery_images.forEach((img) => {
            packageImages.push(cleanImage(img));
          });
        }
        const uniqueImages = Array.from(new Set(packageImages.filter(Boolean)));

        sitemapData.push({
          url: encodeURI(`${baseUrl}/${locale}/${pSeg}/${pkgSeg}`),
          lastModified: new Date(
            pkg.updated_at || FALLBACK_LASTMOD,
          ).toISOString(),
          changeFrequency: "weekly",
          priority: 0.9,
          alternates: getAlternates((loc) => {
            const tSeg =
              pagesContentService.getCorePageSegment(
                packagesParent || "packages",
                loc,
              ) || "packages";
            const tPkgTitle = pkg.title?.[loc];
            const tPkgSeg = tPkgTitle
              ? generateNativeSlug(tPkgTitle) || pkg.slug
              : pkg.slug;
            return `/${tSeg}/${tPkgSeg}`;
          }),
          ...(uniqueImages.length > 0 ? { images: uniqueImages } : {}),
          ...(videos.length > 0 ? { videos } : {}),
        });
      });
    }
  }

  if (resolvedId === "locations") {
    const activeLocations = await locationsService.getLocations();
    const corePages = await pagesContentService.getAllPages();
    const locationsParent = corePages.find((p) => p.slug === "locations");

    for (const locItem of activeLocations) {
      locales.forEach((locale) => {
        const pSeg =
          pagesContentService.getCorePageSegment(
            locationsParent || "locations",
            locale,
          ) || "locations";
        const locTitleLoc = locItem.title?.[locale];
        const locSeg = locTitleLoc
          ? generateNativeSlug(locTitleLoc) || locItem.slug
          : locItem.slug;

        sitemapData.push({
          url: encodeURI(`${baseUrl}/${locale}/${pSeg}/${locSeg}`),
          lastModified: new Date(
            locItem.updated_at || locItem.created_at || FALLBACK_LASTMOD,
          ),
          changeFrequency: "weekly",
          priority: 0.7,
          alternates: getAlternates((loc) => {
            const tSeg =
              pagesContentService.getCorePageSegment(
                locationsParent || "locations",
                loc,
              ) || "locations";
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
  }

  if (resolvedId === "blog-posts") {
    const { supabaseAdmin } = await import("@/lib/supabase");
    if (supabaseAdmin) {
      const corePages = await pagesContentService.getAllPages();
      const blogParent = corePages.find((p) => p.slug === "blog");

      const { data: blogPosts } = await supabaseAdmin
        .from("blog_posts")
        .select("id, updated_at, created_at, status, featured_image")
        .eq("status", "published")
        .not("published_at", "is", null);

      if (blogPosts && blogPosts.length > 0) {
        const postIds = blogPosts.map((bp: any) => bp.id);
        const { data: translations } = await supabaseAdmin
          .from("blog_post_translations")
          .select("post_id, locale, slug")
          .in("post_id", postIds)
          .limit(5000);

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

            const pSeg =
              pagesContentService.getCorePageSegment(
                blogParent || "blog",
                locale,
              ) || "blog";

            const postAlternates: Record<string, string> = {};
            translatedLocales.forEach((loc: string) => {
              const bSeg =
                pagesContentService.getCorePageSegment(
                  blogParent || "blog",
                  loc,
                ) || "blog";
              const bSlug = postTranslations.find(
                (t: any) => t.locale === loc,
              )?.slug;
              if (bSlug) {
                postAlternates[loc] = encodeURI(
                  `${baseUrl}/${loc}/${bSeg}/${bSlug}`,
                );
              }
            });

            if (postAlternates.en) {
              postAlternates["x-default"] = postAlternates.en;
            } else if (translatedLocales.length > 0) {
              const firstLoc = translatedLocales[0];
              postAlternates["x-default"] = postAlternates[firstLoc];
            }

            sitemapData.push({
              url: encodeURI(`${baseUrl}/${locale}/${pSeg}/${tSlug}`),
              lastModified: new Date(
                bp.updated_at || bp.created_at || FALLBACK_LASTMOD,
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
      }
    }
  }

  if (resolvedId === "blog-meta") {
    const { supabaseAdmin } = await import("@/lib/supabase");
    if (supabaseAdmin) {
      const corePages = await pagesContentService.getAllPages();
      const blogParent = corePages.find((p) => p.slug === "blog");

      // Blog Categories (only emit locales with at least 1 published post to avoid noindex URLs in sitemap)
      const { data: blogCategories } = await supabaseAdmin
        .from("blog_categories")
        .select(
          "id, slug, updated_at, created_at, translations:blog_category_translations(locale, name), post_links:blog_post_categories(post:blog_posts(status, published_at, translations:blog_post_translations(locale)))",
        );
      if (blogCategories && blogCategories.length > 0) {
        for (const bc of blogCategories) {
          const catTranslations = bc.translations || [];
          if (catTranslations.length === 0) continue;

          const publishedPostLocales = new Set<string>();
          for (const link of bc.post_links || []) {
            const linkedPost = (link as any)?.post;
            if (
              linkedPost?.status === "published" &&
              linkedPost?.published_at
            ) {
              for (const tr of linkedPost.translations || []) {
                if (tr?.locale) publishedPostLocales.add(tr.locale);
              }
            }
          }

          const indexableLocales = catTranslations
            .map((t: any) => t.locale as string)
            .filter((loc: string) => publishedPostLocales.has(loc));

          if (indexableLocales.length === 0) continue;

          indexableLocales.forEach((locale: string) => {
            const pSeg =
              pagesContentService.getCorePageSegment(
                blogParent || "blog",
                locale,
              ) || "blog";
            const taxSeg = getBlogTaxonomySegment("category", locale);
            const tName = catTranslations.find(
              (t: any) => t.locale === locale,
            )?.name;
            const catSlug = (tName && generateNativeSlug(tName)) || bc.slug;

            const catAlternates: Record<string, string> = {};
            indexableLocales.forEach((loc: string) => {
              const bSeg =
                pagesContentService.getCorePageSegment(
                  blogParent || "blog",
                  loc,
                ) || "blog";
              const locTaxSeg = getBlogTaxonomySegment("category", loc);
              const locName = catTranslations.find(
                (t: any) => t.locale === loc,
              )?.name;
              const locCatSlug =
                (locName && generateNativeSlug(locName)) || bc.slug;
              catAlternates[loc] = encodeURI(
                `${baseUrl}/${loc}/${bSeg}/${locTaxSeg}/${locCatSlug}`,
              );
            });
            if (catAlternates.en) catAlternates["x-default"] = catAlternates.en;
            else if (indexableLocales.length > 0)
              catAlternates["x-default"] = catAlternates[indexableLocales[0]];

            sitemapData.push({
              url: encodeURI(
                `${baseUrl}/${locale}/${pSeg}/${taxSeg}/${catSlug}`,
              ),
              lastModified: new Date(
                bc.updated_at || bc.created_at || FALLBACK_LASTMOD,
              ),
              changeFrequency: "weekly",
              priority: 0.5,
              alternates: { languages: catAlternates },
            });
          });
        }
      }

      // Note: Blog tags are marked noindex (thin taxonomy) and are excluded from the sitemap
      // to comply with Google Search Central guidelines against submitting noindex URLs.
    }
  }

  return sitemapData;
}
