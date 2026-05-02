"use client";

import { Clock, Image as ImageIcon, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo } from "react";
import { useCurrency } from "@/contexts/currency-context";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Link from "next/link";
import { trackSelectItem, trackViewItemList } from "@/lib/analytics";
import { calculateDiscountedPrice } from "@/lib/pricing";
import type { AggregateRating } from "@/types/reviews";
import { cn } from "@/lib/utils";
import { extractPhotosCount } from "@/lib/features-parser";

import type { PackageDB } from "@/lib/packages-service";
import type { DiscountDB } from "@/lib/discount-service";
import { generateNativeSlug } from "@/lib/slug-generator";
import { useSearchIntent } from "@/hooks/use-search-intent";

interface PackagesSectionProps {
  header?: React.ReactNode;
  customCtaHeader?: React.ReactNode;
  aggregateRating?: AggregateRating;
  dbPackages?: PackageDB[];
  parentSlug?: string;
  activeDiscount?: DiscountDB | null;
}

export function PackagesSection({ header, customCtaHeader, aggregateRating, dbPackages = [], parentSlug, activeDiscount = null }: PackagesSectionProps) {

  const t = useTranslations("packages");
  const tui = useTranslations("ui");
  const locale = useLocale();
  const { formatPrice } = useCurrency();
  const { intentSlug } = useSearchIntent();

  const packages = useMemo(() => {
    const today = new Date();

    // If we have dynamic packages from DB, use them
    if (dbPackages && dbPackages.length > 0) {
      return dbPackages.map((pkg) => {
        // Find correct language string or fallback to english
        const locName = pkg.title[locale] || pkg.title["en"] || pkg.slug;
        const locDuration = pkg.duration[locale] || pkg.duration["en"] || "";
        const locFeatures = pkg.features[locale] || pkg.features["en"] || [];

        // Generate native slug if translation exists, otherwise strict fallback
        const nativeSlug = pkg.title[locale] ? generateNativeSlug(pkg.title[locale]) : pkg.slug;

        return {
          id: nativeSlug,
          dbSlug: pkg.slug,
          name: locName,
          basePrice: pkg.price,
          pricing: calculateDiscountedPrice(pkg.price, activeDiscount),
          duration: locDuration,
          photos: extractPhotosCount(locFeatures),
          locations: pkg.locations || 1,
          features: locFeatures,
          popular: pkg.is_popular, // Set via dynamic CMS switch
          isPerPerson: pkg.is_per_person,
          image: pkg.cover_image || "",
        };
      });
    }

    return [];
  }, [dbPackages, locale]);

  const sortedPackages = useMemo(() => {
    if (!intentSlug) return packages;
    return [...packages].sort((a, b) => {
      // AI Recommended package goes first
      if (a.dbSlug === intentSlug && b.dbSlug !== intentSlug) return -1;
      if (b.dbSlug === intentSlug && a.dbSlug !== intentSlug) return 1;
      return 0;
    });
  }, [packages, intentSlug]);

  // Track view_item_list (GA4 funnel step 1)
  useEffect(() => {
    // GA4 Enhanced Ecommerce — view_item_list
    trackViewItemList(
      sortedPackages.map((pkg) => ({
        id: pkg.id,
        name: pkg.name,
        price: pkg.pricing.price,
      })),
    );
  }, [packages]);

  const handlePackageClick = (pkg: any) => {
    trackSelectItem({
      id: pkg.id,
      name: pkg.name,
      price: pkg.pricing.price,
    });
  };

  const renderPackageCard = (pkg: any, asHeading: boolean = true) => (
    <div
      className="relative cursor-pointer h-full"
      onClick={() => handlePackageClick(pkg)}
    >
      <Link
        href={`/${locale}/${parentSlug || "packages"}/${pkg.id}`}
        className="block h-full group"
      >
        <Card
          className={`aspect-[3/4] w-full flex flex-col overflow-hidden p-0 gap-0 pt-0 ${pkg.popular ? "ring-2 ring-primary shadow-xl sm:scale-105 bg-gradient-to-b from-background to-primary/5" : "border-2 hover:border-primary/20"}`}
        >
          {/* Image taking 85% */}
          <div className="relative h-[85%] w-full overflow-hidden">
            {pkg.image ? (
              <Image
                src={pkg.image}
                alt={pkg.name}
                fill
                className="object-cover transition-transform duration-500 hover:scale-110"
                sizes="(max-width: 639px) 80vw, (max-width: 1023px) 45vw, 22vw"
                quality={50}
              />
            ) : (
              <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground/30">
                <ImageIcon className="w-12 h-12 mb-2" />
              </div>
            )}

            {/* Title Overlay at bottom of image */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12 pb-3 px-4 z-10">
              {asHeading ? (
                <h3 className="text-xl sm:text-2xl font-bold text-white line-clamp-2 drop-shadow-md">
                  {pkg.name}
                </h3>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-white line-clamp-2 drop-shadow-md">
                  {pkg.name}
                </div>
              )}
            </div>

            {/* Seasonal Discount Badge (Top Right) */}
            <div className="absolute top-2 end-2 z-10 flex flex-col gap-2 items-end">
              {pkg.popular && (
                <Badge className="bg-primary text-primary-foreground px-2 sm:px-4 py-1 text-xs sm:text-sm shadow-md">
                  {tui("most_popular")}
                </Badge>
              )}
              {pkg.pricing.isDiscounted && activeDiscount && (
                <Badge className="bg-sale text-sale-foreground px-2 py-0.5 text-[10px] sm:text-xs shadow-md animate-pulse border-0">
                  -{Math.round(pkg.pricing.discountPercentage * 100)}%{" "}
                  {activeDiscount.name}
                </Badge>
              )}
            </div>
          </div>

          {/* Footer taking 15% */}
          <div className="h-[15%] flex flex-row items-center justify-between p-0 px-4 bg-background">
            {/* Left: Review Rating */}
            <div className="flex items-center">
              {aggregateRating ? (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-bold text-foreground">{aggregateRating.average}</span>
                  <span className="text-xs text-muted-foreground font-medium">({aggregateRating.count})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-bold text-foreground">5.0</span>
                </div>
              )}
            </div>

            {/* Right: Price */}
            <div className="flex flex-col items-end justify-center leading-none">
              <div className="flex items-center gap-1.5">
                {pkg.pricing.isDiscounted && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(pkg.basePrice)}
                  </span>
                )}
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(pkg.pricing.isDiscounted ? pkg.pricing.price : pkg.basePrice)}
                </span>
              </div>
              {pkg.isPerPerson && (
                <span className="text-[10px] text-muted-foreground font-normal mt-0.5">
                  {t("per_person")}
                </span>
              )}
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );

  return (
    <>
      <section className="py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {header}

          {/* Mobile Carousel View (Visible only on small screens) */}
          <div className="sm:hidden -mx-4">
            <Carousel
              opts={{
                align: "center", // Center the cards for a balanced look
                // dragFree: false is default, which enables snapping
              }}
              className="w-full"
            >
              {/* Added py-4 to prevent ring/shadow clipping */}
              <CarouselContent className="-ms-4 px-4 py-4">
                {sortedPackages.map((pkg) => (
                  <CarouselItem key={pkg.id} className="ps-4 basis-[78%]">
                    <div className="h-full px-0.5"> {/* Extra tiny padding for ring/shadow */}
                      {renderPackageCard(pkg, false)}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop & Tablet Grid View (Hidden on mobile) */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mx-auto">
            {sortedPackages.map((pkg) => (
              <div key={pkg.id}>
                {renderPackageCard(pkg, true)}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
