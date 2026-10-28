import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackageDetails } from "@/components/package-details";
import { PackagesSection } from "@/components/packages-section";
import { SchemaInjector } from "@/components/schema-injector";
import { addonsService } from "@/lib/addons-service";
import { availabilityService } from "@/lib/availability-service";
import { discountService } from "@/lib/discount-service";
import { packagesService } from "@/lib/packages-service";
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

  const activeDiscounts = await discountService.getActiveDiscounts();
  const timeSurcharges = await availabilityService.getTimeSurcharges();
  const availableAddons = await addonsService.getActiveAddonsForPackage(pkg.id);

  // Fetch real reviews data
  const aggregateRating = await reviewsService.getAggregateRating();
  const { reviews } = await reviewsService.fetchGoogleReviews(locale);

  const title = pkg.title[locale] || pkg.title.en || pkg.slug;
  const desc = pkg.description[locale] || pkg.description.en || "";
  const _feat = pkg.features[locale] || pkg.features.en || [];
  const _dur = pkg.duration[locale] || pkg.duration.en || "1 hour";
  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();

  const { pagesContentService } = await import("@/lib/pages-content-service");
  const { generateNativeSlug } = await import("@/lib/slug-generator");
  const packagesPage = await pagesContentService.getPageBySlug("packages");
  const parentTitle = packagesPage?.title?.[locale];
  const parentSegment = parentTitle
    ? generateNativeSlug(parentTitle) || parentSlug
    : packagesPage?.slug || parentSlug;
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

  const serviceSchema = buildServiceSchema({
    name: title,
    description: generateSeoDescription(desc),
    image: pkg.gallery_images?.[0] || settings.default_og_image_url || "",
    price: pkg.price,
    currency: "EUR",
    aggregateRating: aggregateRating.average,
    reviewCount: aggregateRating.count || 1,
    providerName: settings.organization_name || settings.site_name,
    providerUrl: getBaseUrl(),
    discount: currentDiscount,
    reviews: reviews,
    url: encodeURI(
      `${getBaseUrl()}/${locale}/${parentSegment}/${canonicalPackageSegment}`,
    ),
  });

  const videoSchema = pkg.video_url
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: `${title} - Video`,
        description: generateSeoDescription(desc),
        thumbnailUrl: resolveSchemaImage(
          pkg.gallery_images?.[0] ||
            pkg.cover_image ||
            settings.default_og_image_url ||
            "",
        ),
        uploadDate:
          pkg.created_at || pkg.updated_at || new Date().toISOString(),
        duration: "PT59S",
        width: 1080,
        height: 1920,
        contentUrl: pkg.video_url,
      }
    : null;

  const allPackages = await packagesService.getActivePackages();
  const relatedPackages = allPackages.filter((p) => p.id !== pkg.id);
  const t = await getTranslations({ locale, namespace: "packages" });

  return (
    <div>
      <SchemaInjector schema={serviceSchema} />
      {videoSchema && <SchemaInjector schema={videoSchema} />}
      <BreadcrumbNav customLastLabel={title} />
      <PackageDetails
        packageData={pkg}
        aggregateRating={aggregateRating}
        reviews={reviews}
        activeDiscounts={activeDiscounts}
        timeSurcharges={timeSurcharges}
        availableAddons={availableAddons}
        whatsappNumber={settings.whatsapp_number}
      />
      {relatedPackages.length > 0 && (
        <div className="mt-0 sm:mt-8 border-t border-border/30 bg-muted/10">
          <PackagesSection
            dbPackages={relatedPackages}
            activeDiscounts={activeDiscounts}
            aggregateRating={aggregateRating}
            parentSlug={parentSlug}
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
