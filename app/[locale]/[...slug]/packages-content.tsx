import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PageHeroSection } from "@/components/page-hero-section";
import { SeoEditorialSection } from "@/components/seo-editorial-section";

const PackagesSection = dynamic(() =>
  import("@/components/packages-section").then((mod) => mod.PackagesSection),
);

import { SchemaInjector } from "@/components/schema-injector";
import { pagesContentService } from "@/lib/pages-content-service";
import {
  getCachedActiveDiscounts,
  getCachedActivePackages,
} from "@/lib/public-cache";
import { reviewsService } from "@/lib/reviews-service";
import {
  buildCollectionPageSchema,
  enrichSeoDescription,
  generateSeoDescription,
  getBaseUrl,
  normalizeSchemaUrl,
} from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";
import { generateNativeSlug } from "@/lib/slug-generator";
export async function PackagesPageContent({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: parentSlug } = await params;

  const [
    dbPage,
    aggregateRating,
    dbPackages,
    activeDiscounts,
    settings,
    dynamicNavData,
    tHub,
  ] = await Promise.all([
    pagesContentService.getPageBySlug("packages"),
    reviewsService.getAggregateRating(),
    getCachedActivePackages(),
    getCachedActiveDiscounts(),
    settingsService.getSettings(),
    pagesContentService.getDynamicCoreNavData(locale),
    getTranslations({ locale, namespace: "seo_hub" }),
  ]);
  const parentSegment =
    pagesContentService.getCorePageSegment(dbPage || "packages", locale) ||
    parentSlug;
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "";
  const dynamicSubtitle =
    dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";
  const baseUrl = getBaseUrl(settings.app_base_url);

  const collectionSchema = buildCollectionPageSchema({
    name: dynamicTitle,
    description: enrichSeoDescription(dynamicSubtitle, "packages", locale),
    url: normalizeSchemaUrl(`${baseUrl}/${locale}/${parentSegment}`),
    inLanguage: locale,
    items: dbPackages.map((pkg) => {
      const pkgTitleLoc = pkg.title?.[locale];
      const pkgSeg = pkgTitleLoc
        ? generateNativeSlug(pkgTitleLoc) || pkg.slug
        : pkg.slug;
      return {
        name: pkg.title?.[locale] || pkg.title?.en || pkg.slug,
        description:
          pkg.description?.[locale] || pkg.description?.en
            ? generateSeoDescription(
                pkg.description?.[locale] || pkg.description?.en || "",
              )
            : undefined,
        url: normalizeSchemaUrl(
          `${baseUrl}/${locale}/${parentSegment}/${pkgSeg}`,
        ),
        image: pkg.cover_image || pkg.gallery_images?.[0],
      };
    }),
  });

  return (
    <div>
      <SchemaInjector schema={collectionSchema} />
      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />
      <div className="section-contain-auto">
        {/* Pass the purely dynamic packages object to Section along with parentSlug */}
        <PackagesSection
          aggregateRating={aggregateRating}
          dbPackages={dbPackages}
          parentSlug={parentSegment}
          activeDiscounts={activeDiscounts}
          cardHeadingLevel="h2"
        />
      </div>
      <SeoEditorialSection
        id="istanbul-photoshoot-guide"
        title={tHub("packages.title")}
        subtitle={tHub("packages.subtitle")}
        items={[
          {
            title: tHub("packages.item1_title"),
            description: tHub("packages.item1_desc"),
          },
          {
            title: tHub("packages.item2_title"),
            description: tHub("packages.item2_desc"),
          },
          {
            title: tHub("packages.item3_title"),
            description: tHub("packages.item3_desc"),
          },
        ]}
        links={[
          {
            href: `/${locale}/${dynamicNavData.locations?.path || "locations"}`,
            label: tHub("packages.link_locations"),
          },
          {
            href: `/${locale}/${dynamicNavData.about?.path || "about"}`,
            label: tHub("packages.link_about"),
          },
          {
            href: `/${locale}/${dynamicNavData.blog?.path || "blog"}`,
            label: tHub("packages.link_blog"),
          },
        ]}
      />
    </div>
  );
}
