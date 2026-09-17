import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ProgrammaticSeoPage } from "@/components/programmatic-seo-page";
import { SchemaInjector } from "@/components/schema-injector";

import { availabilityService } from "@/lib/availability-service";
import { discountService } from "@/lib/discount-service";
import { packagesService } from "@/lib/packages-service";
import { locationsService } from "@/lib/locations-service";
import { reviewsService } from "@/lib/reviews-service";
import { settingsService } from "@/lib/settings-service";
import {
  buildServiceSchema,
  generateSeoDescription,
  generateSeoTitle,
  getBaseUrl,
  optimizeSeoImage,
  constructOpenGraph,
} from "@/lib/seo-utils";
import { generateNativeSlug } from "@/lib/slug-generator";

export const revalidate = 60; // Cache for 60 seconds

export async function generateMetadata(props: {
  params: Promise<{ locale: string; location: string; package: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { routing } = await import("@/i18n/routing");

  if (!routing.locales.includes(params.locale as any)) {
    return {};
  }

  const [locationItem, packageItem, settings] = await Promise.all([
    locationsService.getLocationBySlug(params.location),
    packagesService.getPackageBySlug(params.package),
    settingsService.getSettings(),
  ]);

  if (!locationItem || !packageItem) {
    return {};
  }

  const locTitle = locationItem.title?.[params.locale] || locationItem.title?.en || locationItem.slug;
  const pkgTitle = packageItem.title?.[params.locale] || packageItem.title?.en || packageItem.slug;
  
  // Dynamic Title combination (e.g. "Couples Photoshoot in Galata Tower")
  const dynamicTitle = `${pkgTitle} in ${locTitle}`;
  const dynamicDesc = packageItem.meta_description?.[params.locale] || packageItem.description?.[params.locale] || "";

  const title = generateSeoTitle(dynamicTitle, params.locale, settings.site_name || "");
  const desc = generateSeoDescription(dynamicDesc);

  const ogImage = locationItem.cover_image || packageItem.cover_image || settings.default_og_image_url || "";
  const keywords = [...(packageItem.meta_keywords?.[params.locale] || []), ...(locationItem.tags || [])];

  const getAlternates = () => {
    const langs: Record<string, string> = {};
    const baseUrl = getBaseUrl();
    routing.locales.forEach((loc) => {
      const locLocTitle = locationItem.title?.[loc];
      const pkgLocTitle = packageItem.title?.[loc];
      const lSlug = locLocTitle ? generateNativeSlug(locLocTitle) || locationItem.slug : locationItem.slug;
      const pSlug = pkgLocTitle ? generateNativeSlug(pkgLocTitle) || packageItem.slug : packageItem.slug;
      
      langs[loc] = encodeURI(`${baseUrl}/${loc}/photoshoot/${lSlug}/${pSlug}`);
    });
    
    // Set default fallback to english
    if (langs["en"]) langs["x-default"] = langs["en"];
    
    return { languages: langs };
  };

  return {
    title,
    description: desc,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: encodeURI(`${getBaseUrl()}/${params.locale}/photoshoot/${params.location}/${params.package}`),
      ...getAlternates(),
    },
    openGraph: constructOpenGraph(
      title,
      desc,
      ogImage,
      settings.site_name || "",
      params.locale
    ),
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ogImage ? [optimizeSeoImage(ogImage, 1200)] : [],
    },
  };
}

export default async function ProgrammaticSeoRoute(props: {
  params: Promise<{ locale: string; location: string; package: string }>;
}) {
  const params = await props.params;
  const [locationItem, packageItem, settings] = await Promise.all([
    locationsService.getLocationBySlug(params.location),
    packagesService.getPackageBySlug(params.package),
    settingsService.getSettings(),
  ]);

  if (!locationItem || !packageItem || !locationItem.is_active || !packageItem.is_active) {
    notFound();
  }

  const [activeDiscount, timeSurcharges, aggregateRating, { reviews }] = await Promise.all([
    discountService.getActiveDiscount(),
    availabilityService.getTimeSurcharges(),
    reviewsService.getAggregateRating(),
    reviewsService.fetchGoogleReviews(params.locale),
  ]);

  const locTitle = locationItem.title?.[params.locale] || locationItem.title?.en || locationItem.slug;
  const pkgTitle = packageItem.title?.[params.locale] || packageItem.title?.en || packageItem.slug;
  const combinedTitle = `${pkgTitle} in ${locTitle}`;
  const desc = packageItem.description?.[params.locale] || packageItem.description?.en || "";

  // Merge schemas to present a rich entity to Google
  const serviceSchema = buildServiceSchema({
    name: combinedTitle,
    description: generateSeoDescription(desc),
    image: locationItem.cover_image || packageItem.cover_image || settings.default_og_image_url || "",
    price: packageItem.price,
    currency: "EUR",
    aggregateRating: aggregateRating.average,
    reviewCount: aggregateRating.count || 1,
    providerName: settings.organization_name || settings.site_name,
    providerUrl: getBaseUrl(),
    discount: activeDiscount,
    reviews: reviews,
    url: `${getBaseUrl()}/${params.locale}/photoshoot/${params.location}/${params.package}`,
  });

  return (
    <>
      <SchemaInjector schema={serviceSchema} />
      <ProgrammaticSeoPage 
        packageData={packageItem}
        locationData={locationItem}
        aggregateRating={aggregateRating}
        reviews={reviews}
        activeDiscount={activeDiscount}
        timeSurcharges={timeSurcharges}
        whatsappNumber={settings.whatsapp_number}
        baseUrl={getBaseUrl()}
      />
    </>
  );
}
