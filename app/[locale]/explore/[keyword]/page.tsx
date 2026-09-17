import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { IntentDiscoveryPage } from "@/components/intent-discovery-page";
import { seoKeywordsService } from "@/lib/seo-keywords-service";
import { discountService } from "@/lib/discount-service";
import { reviewsService } from "@/lib/reviews-service";
import { settingsService } from "@/lib/settings-service";
import {
  generateSeoTitle,
  generateSeoDescription,
  getBaseUrl,
  constructOpenGraph,
  optimizeSeoImage,
} from "@/lib/seo-utils";

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(props: {
  params: Promise<{ locale: string; keyword: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { routing } = await import("@/i18n/routing");

  if (!routing.locales.includes(params.locale as any)) {
    return {};
  }

  const [intent, settings] = await Promise.all([
    seoKeywordsService.getIntentBySlug(params.keyword),
    settingsService.getSettings(),
  ]);

  if (!intent) return {};

  const intentTitle = intent.title[params.locale] || intent.title["en"];
  const intentDesc = intent.description[params.locale] || intent.description["en"];

  const title = generateSeoTitle(intentTitle, params.locale, settings.site_name || "");
  const desc = generateSeoDescription(intentDesc);
  const ogImage = intent.cover_image || settings.default_og_image_url || "";

  const getAlternates = () => {
    const langs: Record<string, string> = {};
    const baseUrl = getBaseUrl();
    routing.locales.forEach((loc) => {
      langs[loc] = encodeURI(`${baseUrl}/${loc}/explore/${intent.slug}`);
    });
    if (langs["en"]) langs["x-default"] = langs["en"];
    return { languages: langs };
  };

  return {
    title,
    description: desc,
    alternates: {
      canonical: encodeURI(`${getBaseUrl()}/${params.locale}/explore/${intent.slug}`),
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

export default async function ExploreKeywordRoute(props: {
  params: Promise<{ locale: string; keyword: string }>;
}) {
  const params = await props.params;
  
  const intent = await seoKeywordsService.getIntentBySlug(params.keyword);
  if (!intent) {
    notFound();
  }

  const [packages, activeDiscount, aggregateRating] = await Promise.all([
    seoKeywordsService.getPackagesForIntent(intent),
    discountService.getActiveDiscount(),
    reviewsService.getAggregateRating(),
  ]);

  return (
    <IntentDiscoveryPage
      intent={intent}
      packages={packages}
      activeDiscount={activeDiscount}
      aggregateRating={aggregateRating}
      baseUrl={getBaseUrl()}
    />
  );
}
