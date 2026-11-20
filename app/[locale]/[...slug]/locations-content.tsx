import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LocationCard } from "@/components/location-card";
import { PageHeroSection } from "@/components/page-hero-section";
import { SchemaInjector } from "@/components/schema-injector";
import { SeoEditorialSection } from "@/components/seo-editorial-section";
import { locationsService } from "@/lib/locations-service";
import { pagesContentService } from "@/lib/pages-content-service";
import {
  buildCollectionPageSchema,
  enrichSeoDescription,
  generateSeoDescription,
  getBaseUrl,
  normalizeSchemaUrl,
} from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";
import { generateNativeSlug } from "@/lib/slug-generator";

export async function LocationsPageContent({
  params,
}: {
  params:
    | Promise<{ locale: string; slug: string }>
    | { locale: string; slug: string };
}) {
  const { locale, slug: parentSlug } = await params;
  const [dbPage, dbLocations, settings, dynamicNavData, tHub] =
    await Promise.all([
      pagesContentService.getPageBySlug("locations"),
      locationsService.getLocations(),
      settingsService.getSettings(),
      pagesContentService.getDynamicCoreNavData(locale),
      getTranslations({ locale, namespace: "seo_hub" }),
    ]);
  const parentSegment =
    pagesContentService.getCorePageSegment(dbPage || "locations", locale) ||
    parentSlug;
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "";
  const dynamicSubtitle =
    dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";
  const baseUrl = getBaseUrl(settings.app_base_url);

  const collectionSchema = buildCollectionPageSchema({
    name: dynamicTitle,
    description: enrichSeoDescription(dynamicSubtitle, "locations", locale),
    url: normalizeSchemaUrl(`${baseUrl}/${locale}/${parentSegment}`),
    inLanguage: locale,
    items: dbLocations.map((location) => {
      const locTitleLoc = location.title?.[locale];
      const locSeg = locTitleLoc
        ? generateNativeSlug(locTitleLoc) || location.slug
        : location.slug;
      return {
        name: location.title?.[locale] || location.title?.en || location.slug,
        description:
          location.description?.[locale] || location.description?.en
            ? generateSeoDescription(
                location.description?.[locale] ||
                  location.description?.en ||
                  "",
              )
            : undefined,
        url: normalizeSchemaUrl(
          `${baseUrl}/${locale}/${parentSegment}/${locSeg}`,
        ),
        image: location.cover_image || undefined,
      };
    }),
  });

  return (
    <div>
      <SchemaInjector schema={collectionSchema} />{" "}
      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />
      {/* Locations Grid */}
      <section className="py-8 sm:py-10 section-contain-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {dbLocations.map((location, index) => (
              <LocationCard
                key={location.slug}
                location={location}
                index={index}
                parentSlug={parentSegment}
                headingLevel="h2"
              />
            ))}
          </div>
        </div>
      </section>
      <SeoEditorialSection
        id="istanbul-location-planning"
        title={tHub("locations.title")}
        subtitle={tHub("locations.subtitle")}
        items={[
          {
            title: tHub("locations.item1_title"),
            description: tHub("locations.item1_desc"),
          },
          {
            title: tHub("locations.item2_title"),
            description: tHub("locations.item2_desc"),
          },
          {
            title: tHub("locations.item3_title"),
            description: tHub("locations.item3_desc"),
          },
        ]}
        links={[
          {
            href: `/${locale}/${dynamicNavData.packages?.path || "packages"}`,
            label: tHub("locations.link_packages"),
          },
          {
            href: `/${locale}/${dynamicNavData.blog?.path || "blog"}`,
            label: tHub("locations.link_blog"),
          },
          {
            href: `/${locale}/${dynamicNavData.contact?.path || "contact"}`,
            label: tHub("locations.link_contact"),
          },
        ]}
      />
    </div>
  );
}
