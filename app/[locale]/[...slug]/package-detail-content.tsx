import { notFound } from "next/navigation";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackageDetails } from "@/components/package-details";
import { packagesService } from "@/lib/packages-service";
import { discountService } from "@/lib/discount-service";
import { reviewsService } from "@/lib/reviews-service";
import { availabilityService } from "@/lib/availability-service";
import { SchemaInjector } from "@/components/schema-injector";
import { buildServiceSchema, generateSeoDescription, getBaseUrl } from "@/lib/seo-utils";

interface PackagePageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

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

  if (!pkg || !pkg.is_active) {
    notFound();
  }

  const activeDiscount = await discountService.getActiveDiscount();
  const timeSurcharges = await availabilityService.getTimeSurcharges();



  // Fetch real reviews data
  const aggregateRating = await reviewsService.getAggregateRating();
  const { reviews } = await reviewsService.fetchGoogleReviews(locale);


  const title = pkg.title[locale] || pkg.title["en"] || pkg.slug;
  const desc = pkg.description[locale] || pkg.description["en"] || "";
  const feat = pkg.features[locale] || pkg.features["en"] || [];
  const dur = pkg.duration[locale] || pkg.duration["en"] || "1 hour";
  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();

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
    discount: activeDiscount,
    reviews: reviews,
  });

  const videoSchema = pkg.video_url ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": `${title} - Video`,
    "description": generateSeoDescription(desc),
    "thumbnailUrl": pkg.gallery_images?.[0] || pkg.cover_image || settings.default_og_image_url || "",
    "uploadDate": pkg.created_at || pkg.updated_at || new Date().toISOString(),
    "duration": "PT59S",
    "width": 1080,
    "height": 1920,
    "contentUrl": pkg.video_url
  } : null;

  return (
    <div>
      <SchemaInjector schema={serviceSchema} />
      {videoSchema && <SchemaInjector schema={videoSchema} />}
      <BreadcrumbNav customLastLabel={title} />
      <PackageDetails
        packageData={pkg}
        aggregateRating={aggregateRating}
        reviews={reviews}
        activeDiscount={activeDiscount}
        timeSurcharges={timeSurcharges}
        whatsappNumber={settings.whatsapp_number}
      />
    </div>
  );
}
