import { MetadataRoute } from "next";
import { pagesContentService } from "@/lib/pages-content-service";
import { packagesService } from "@/lib/packages-service";
import { locationsService } from "@/lib/locations-service";
import { routing } from "@/i18n/routing";
import { getBaseUrl } from "@/lib/seo-utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const locales = routing.locales;

  const getAlternates = (pathResolver: (locale: string) => string) => {
    const languages: Record<string, string> = {};
    locales.forEach((loc) => {
      languages[loc] = `${baseUrl}/${loc}${pathResolver(loc)}`;
    });
    return { languages };
  };

  const sitemapData: MetadataRoute.Sitemap = [];
  const { generateNativeSlug } = await import("@/lib/slug-generator");

  // 1. Home Pages (All Locales)
  locales.forEach((locale) => {
    sitemapData.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
      alternates: getAlternates(() => ""),
    });
  });

  // 2. Core Dynamic Pages from PagesContentService
  const corePages = await pagesContentService.getAllPages();
  const activeCorePages = corePages.filter(p => p.is_active && !p.slug.includes("home-"));

  for (const page of activeCorePages) {
    if (page.slug === "home") continue;

    locales.forEach((locale) => {
      const titleLoc = page.title?.[locale];
      const pageSeg = titleLoc ? `/${generateNativeSlug(titleLoc)}` : `/${page.slug}`;

      sitemapData.push({
        url: `${baseUrl}/${locale}${pageSeg}`,
        lastModified: new Date(page.updated_at || page.created_at || new Date()),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: getAlternates((loc) => {
          const tLoc = page.title?.[loc];
          return tLoc ? `/${generateNativeSlug(tLoc)}` : `/${page.slug}`;
        }),
      });
    });
  }

  // 3. Packages
  const activePackages = await packagesService.getActivePackages();
  const packagesParent = corePages.find(p => p.slug === "packages");
  
  for (const pkg of activePackages) {
    locales.forEach((locale) => {
      const pTitle = packagesParent?.title?.[locale];
      const pSeg = pTitle ? generateNativeSlug(pTitle) : "packages";

      sitemapData.push({
        url: `${baseUrl}/${locale}/${pSeg}/${pkg.slug}`,
        lastModified: new Date(pkg.updated_at || pkg.created_at || new Date()),
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: getAlternates((loc) => {
          const tTitle = packagesParent?.title?.[loc];
          const tSeg = tTitle ? generateNativeSlug(tTitle) : "packages";
          return `/${tSeg}/${pkg.slug}`;
        }),
      });
    });
  }

  // 4. Locations
  const activeLocations = await locationsService.getLocations();
  const locationsParent = corePages.find(p => p.slug === "locations");

  for (const locItem of activeLocations) {
    locales.forEach((locale) => {
      const pTitle = locationsParent?.title?.[locale];
      const pSeg = pTitle ? generateNativeSlug(pTitle) : "locations";

      sitemapData.push({
        url: `${baseUrl}/${locale}/${pSeg}/${locItem.slug}`,
        lastModified: new Date(locItem.updated_at || locItem.created_at || new Date()),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: getAlternates((loc) => {
          const tTitle = locationsParent?.title?.[loc];
          const tSeg = tTitle ? generateNativeSlug(tTitle) : "locations";
          return `/${tSeg}/${locItem.slug}`;
        }),
      });
    });
  }

  // 5. Blog Posts
  const { supabaseAdmin } = await import("@/lib/supabase");
  if (supabaseAdmin) {
    const { data: blogPosts } = await supabaseAdmin.from("blog_posts").select("id, updated_at, created_at, status").eq("status", "published");
    
    if (blogPosts && blogPosts.length > 0) {
      const blogParent = corePages.find(p => p.slug === "blog");
      const { data: translations } = await supabaseAdmin.from("blog_post_translations").select("post_id, locale, slug");
      
      for (const bp of blogPosts) {
        const postTranslations = translations?.filter(t => t.post_id === bp.id) || [];
        const enSlug = postTranslations.find(t => t.locale === "en")?.slug;
        if (!enSlug) continue; // Skip if no default translation exists

        locales.forEach((locale) => {
          const tSlug = postTranslations.find(t => t.locale === locale)?.slug || enSlug;
          const pTitle = blogParent?.title?.[locale];
          const pSeg = pTitle ? generateNativeSlug(pTitle) : "blog";

          sitemapData.push({
            url: `${baseUrl}/${locale}/${pSeg}/${tSlug}`,
            lastModified: new Date(bp.updated_at || bp.created_at || new Date()),
            changeFrequency: "monthly",
            priority: 0.6,
            alternates: getAlternates((loc) => {
              const bTitle = blogParent?.title?.[loc];
              const bSeg = bTitle ? generateNativeSlug(bTitle) : "blog";
              const bSlug = postTranslations.find(t => t.locale === loc)?.slug || enSlug;
              return `/${bSeg}/${bSlug}`;
            }),
          });
        });
      }
    }
  }

  return sitemapData;
}
