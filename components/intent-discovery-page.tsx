"use client";

import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { PackagesSection } from "@/components/packages-section";
import type { SeoKeywordIntent } from "@/lib/seo-keywords-service";
import type { PackageDB } from "@/lib/packages-service";
import type { DiscountDB } from "@/lib/discount-service";
import type { AggregateRating } from "@/types/reviews";
import { SchemaInjector } from "@/components/schema-injector";

export interface IntentDiscoveryPageProps {
  intent: SeoKeywordIntent;
  packages: PackageDB[];
  activeDiscount: DiscountDB | null;
  aggregateRating: AggregateRating;
  baseUrl: string;
}

export function IntentDiscoveryPage({
  intent,
  packages,
  activeDiscount,
  aggregateRating,
  baseUrl,
}: IntentDiscoveryPageProps) {
  const t = useTranslations("locations"); // using locations for generic UI text like "Explore Packages"
  const locale = useLocale();

  const title = intent.title[locale] || intent.title["en"];
  const description = intent.description[locale] || intent.description["en"];

  // ItemList Schema for the packages on this intent page
  const itemListElements = packages.map((pkg, index) => {
    const pkgTitle = pkg.title[locale] || pkg.title["en"] || pkg.slug;
    return {
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Service",
        "name": pkgTitle,
        "url": `${baseUrl}/${locale}/packages/${pkg.slug}`
      }
    };
  });

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": itemListElements,
  };

  return (
    <div className="min-h-screen bg-background">
      <SchemaInjector schema={itemListSchema} />

      {/* Hero Section */}
      <section className="relative">
        <div className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden">
          <Image
            src={intent.cover_image}
            alt={title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          <div className="absolute bottom-0 left-0 right-0 pb-6 sm:pb-8 lg:pb-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg font-serif">
                {title}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-white/90 max-w-3xl leading-relaxed drop-shadow-md">
                {description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <div className="bg-muted/10 pb-16">
        <PackagesSection
          dbPackages={packages}
          activeDiscount={activeDiscount}
          aggregateRating={aggregateRating}
          parentSlug={`explore/${intent.slug}`} // Will route to normal package if they click, or we can route back to normal package logic. Actually, if parentSlug is provided, it goes to /locale/parentSlug/pkg.slug. Let's not provide parentSlug so it goes to normal /packages/pkg.slug
          header={
            <div className="mb-6 sm:mb-8 pt-8">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
                {t("explore_packages", { default: "Explore Packages" })}
              </h2>
              <p className="text-muted-foreground">
                {t("explore_packages_desc", { default: "Select a package to view details and book your session." })}
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}
