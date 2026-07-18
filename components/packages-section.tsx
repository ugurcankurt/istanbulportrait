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
          className={cn(
            "relative w-full aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-card border-none transition-all duration-700 hover:-translate-y-2 group-hover:shadow-luxury",
            pkg.popular ? "shadow-luxury sm:scale-[1.02]" : "shadow-sm"
          )}
        >
          {/* Background Image */}
          {pkg.image ? (
            <Image
              src={pkg.image}
              alt={pkg.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              sizes="(max-width: 639px) 80vw, (max-width: 1023px) 45vw, 22vw"
              quality={60}
            />
          ) : (
            <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-muted-foreground/30">
              <ImageIcon className="w-12 h-12 mb-2" />
            </div>
          )}

          {/* Gradients for text readability and top badges */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-0 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-0 pointer-events-none" />

          {/* Seasonal Discount Badge (Top Right) */}
          <div className="absolute top-3 end-3 z-10 flex flex-col gap-2 items-end">
            {pkg.popular && (
              <Badge className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1 text-[10px] sm:text-xs tracking-widest uppercase shadow-sm font-serif">
                {tui("most_popular")}
              </Badge>
            )}
            {pkg.pricing.isDiscounted && activeDiscount && (
              <Badge className="bg-sale/90 backdrop-blur-md border border-white/30 text-white px-2 py-0.5 text-[10px] shadow-sm animate-pulse">
                -{Math.round(pkg.pricing.discountPercentage * 100)}%{" "}
                {activeDiscount.name}
              </Badge>
            )}
          </div>

          {/* Footer Content Area Overlaid on Image */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 sm:p-5">
            {asHeading ? (
              <h3 className="text-xl sm:text-2xl font-serif font-medium text-white line-clamp-2 mb-2 leading-tight drop-shadow-md">
                {pkg.name}
              </h3>
            ) : (
              <div className="text-xl sm:text-2xl font-serif font-medium text-white line-clamp-2 mb-2 leading-tight drop-shadow-md">
                {pkg.name}
              </div>
            )}

            <div className="flex flex-row items-end justify-between pt-2 border-t border-white/20">
              {/* Left: Review Rating */}
              <div className="flex items-center">
                {aggregateRating ? (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-white text-white drop-shadow-sm" />
                    <span className="text-sm font-medium text-white drop-shadow-sm">{aggregateRating.average}</span>
                    <span className="text-xs text-white/80">({aggregateRating.count})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-white text-white drop-shadow-sm" />
                    <span className="text-sm font-medium text-white drop-shadow-sm">5.0</span>
                  </div>
                )}
              </div>

              {/* Right: Price */}
              <div className="flex flex-col items-end justify-center leading-none">
                <div className="flex items-center gap-1.5">
                  {pkg.pricing.isDiscounted && (
                    <span className="text-[10px] sm:text-xs text-white/70 line-through">
                      {formatPrice(pkg.basePrice)}
                    </span>
                  )}
                  <span className="text-lg sm:text-xl font-serif font-semibold text-white drop-shadow-md">
                    {formatPrice(pkg.pricing.isDiscounted ? pkg.pricing.price : pkg.basePrice)}
                  </span>
                </div>
                {pkg.isPerPerson && (
                  <span className="text-[9px] text-white/80 mt-1 uppercase tracking-wider drop-shadow-sm">
                    {t("per_person")}
                  </span>
                )}
              </div>
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
