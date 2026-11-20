import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackageDetails } from "@/components/package-details";
import { PackagesSection } from "@/components/packages-section";
import { SchemaInjector } from "@/components/schema-injector";
import { addonsService } from "@/lib/addons-service";
import { packagesService } from "@/lib/packages-service";
import {
  getCachedActiveDiscounts,
  getCachedActivePackages,
  getCachedTimeSurcharges,
} from "@/lib/public-cache";
import { reviewsService } from "@/lib/reviews-service";
import {
  buildServiceSchema,
  generateSeoDescription,
  getBaseUrl,
  resolveSchemaImage,
} from "@/lib/seo-utils";

// Package Detail Modular Component
export async function PackageDetailPageContent({
  locale,
  slug,
  parentSlug,
}: {
  locale: string;
  slug: string;
  parentSlug: string;
}) {
  const pkg = await packagesService.getPackageBySlug(slug);

  if (!pkg?.is_active) {
    notFound();
  }

  const [
    activeDiscounts,
    timeSurcharges,
    availableAddons,
    aggregateRating,
    reviewsResult,
    { settingsService },
    { pagesContentService },
    { generateNativeSlug },
    allPackages,
    t,
  ] = await Promise.all([
    getCachedActiveDiscounts(),
    getCachedTimeSurcharges(),
    addonsService.getActiveAddonsForPackage(pkg.id),
    reviewsService.getAggregateRating(),
    reviewsService.fetchGoogleReviews(locale),
    import("@/lib/settings-service"),
    import("@/lib/pages-content-service"),
    import("@/lib/slug-generator"),
    getCachedActivePackages(),
    getTranslations({ locale, namespace: "packages" }),
  ]);

  const { reviews } = reviewsResult;
  const [settings, packagesPage] = await Promise.all([
    settingsService.getSettings(),
    pagesContentService.getPageBySlug("packages"),
  ]);

  const title = pkg.title?.[locale] || pkg.title?.en || pkg.slug;
  const desc = pkg.description?.[locale] || pkg.description?.en || "";
  const _feat = pkg.features?.[locale] || pkg.features?.en || [];
  const _dur = pkg.duration?.[locale] || pkg.duration?.en || "1 hour";
  const parentSegment =
    pagesContentService.getCorePageSegment(
      packagesPage || "packages",
      locale,
    ) || parentSlug;
  const localPkgTitle = pkg.title?.[locale];
  const canonicalPackageSegment = localPkgTitle
    ? generateNativeSlug(localPkgTitle) || pkg.slug
    : pkg.slug;

  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const validDiscounts = (activeDiscounts || [])
    .filter((d) => {
      if (!d.is_active) return false;
      if (d.start_date) {
        const s = new Date(d.start_date);
        s.setHours(0, 0, 0, 0);
        if (now.getTime() < s.getTime()) return false;
      }
      if (d.end_date) {
        const e = new Date(d.end_date);
        e.setHours(23, 59, 59, 999);
        if (now.getTime() > e.getTime()) return false;
      }
      return true;
    })
    .sort(
      (a, b) => Number(b.discount_percentage) - Number(a.discount_percentage),
    );
  const currentDiscount = validDiscounts.length > 0 ? validDiscounts[0] : null;

  const packageSchemaImages = Array.from(
    new Set(
      [
        pkg.cover_image,
        ...(Array.isArray(pkg.gallery_images) ? pkg.gallery_images : []),
      ].filter((img): img is string => Boolean(img)),
    ),
  ).slice(0, 5);

  const baseUrl = getBaseUrl(settings.app_base_url);

  const serviceSchema = buildServiceSchema({
    name: title,
    sku: pkg.slug,
    description: generateSeoDescription(desc, 155, locale),
    image:
      packageSchemaImages.length > 0
        ? packageSchemaImages
        : settings.default_og_image_url || "",
    price: pkg.price,
    currency: "EUR",
    aggregateRating: aggregateRating?.average,
    reviewCount: aggregateRating?.count,
    reviews,
    locale,
    providerName: settings.organization_name || settings.site_name,
    providerUrl: baseUrl,
    discount: currentDiscount,
    url: encodeURI(
      `${baseUrl}/${locale}/${parentSegment}/${canonicalPackageSegment}`,
    ),
  });

  const videoSchema = (() => {
    if (!pkg.video_url) return null;
    const thumbnailUrl = resolveSchemaImage(
      pkg.gallery_images?.[0] ||
        pkg.cover_image ||
        settings.default_og_image_url ||
        "",
    );
    if (!thumbnailUrl) return null;

    const ytMatch = pkg.video_url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
    );
    const embedUrl = ytMatch?.[1]
      ? `https://www.youtube.com/embed/${ytMatch[1]}`
      : undefined;
    const contentUrl = !embedUrl
      ? resolveSchemaImage(pkg.video_url)
      : undefined;

    return {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: `${title} - Video`,
      description: generateSeoDescription(desc, 155, locale) || title,
      thumbnailUrl,
      uploadDate: new Date(
        pkg.created_at || pkg.updated_at || "2025-01-01T00:00:00.000Z",
      ).toISOString(),
      width: 1080,
      height: 1920,
      ...(embedUrl ? { embedUrl } : {}),
      ...(contentUrl ? { contentUrl } : {}),
    };
  })();

  const relatedPackages = allPackages.filter((p) => p.id !== pkg.id);

  return (
    <div>
      <SchemaInjector schema={serviceSchema} />
      {videoSchema && <SchemaInjector schema={videoSchema} />}
      <BreadcrumbNav
        customLastLabel={title}
        customParentLabel={
          packagesPage?.content?.nav_title?.[locale] ||
          packagesPage?.title?.[locale] ||
          packagesPage?.title?.en ||
          undefined
        }
        customParentHref={`/${locale}/${parentSegment}`}
        baseUrl={baseUrl}
      />
      <Suspense fallback={null}>
        <PackageDetails
          packageData={pkg}
          aggregateRating={aggregateRating}
          reviews={reviews}
          activeDiscounts={activeDiscounts}
          timeSurcharges={timeSurcharges}
          availableAddons={availableAddons}
          whatsappNumber={settings.whatsapp_number}
        />
      </Suspense>
      {relatedPackages.length > 0 && (
        <div className="mt-0 sm:mt-8 border-t border-border/30 bg-muted/10">
          <PackagesSection
            dbPackages={relatedPackages}
            activeDiscounts={activeDiscounts}
            aggregateRating={aggregateRating}
            parentSlug={parentSegment}
            header={
              <div
                key="related-packages-header"
                className="text-center max-w-2xl mx-auto mb-6 sm:mb-10 pt-6 sm:pt-10"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 font-normal text-foreground leading-tight">
                  {t("related_packages")}
                </h2>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
