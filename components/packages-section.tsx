"use client";

import { Clock, Image as ImageIcon, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo } from "react";
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

  // Track view_item_list (GA4 funnel step 1)
  useEffect(() => {
    // GA4 Enhanced Ecommerce — view_item_list
    trackViewItemList(
      packages.map((pkg) => ({
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
          className={`h-full flex flex-col overflow-hidden p-0 gap-0 pt-0 ${pkg.popular ? "ring-2 ring-primary shadow-xl sm:scale-105 bg-gradient-to-b from-background to-primary/5" : "border-2 hover:border-primary/20"}`}
        >
          <div className="relative h-50 w-full overflow-hidden">
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
            <div className="absolute top-2 start-2 z-10 bg-background/85 backdrop-blur-md text-foreground px-3 py-1 rounded-lg font-bold text-lg sm:text-xl shadow-lg border border-border/50 flex flex-col items-center">
              <span
                className={
                  pkg.pricing.isDiscounted
                    ? "text-xs opacity-80 line-through mb-[-4px]"
                    : ""
                }
              >
                €{pkg.basePrice}
              </span>
              {pkg.pricing.isDiscounted && (
                <span>€{pkg.pricing.price}</span>
              )}
              {pkg.isPerPerson && (
                <span className="text-[10px] sm:text-xs font-normal opacity-90 -mt-1">
                  {t("per_person")}
                </span>
              )}
            </div>
          </div>

          {/* Seasonal Discount Badge */}
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

          <CardHeader className="text-left pb-2 sm:pb-2 px-3 sm:px-4 pt-4">
            {asHeading ? (
              <h3 className="text-xl sm:text-xl font-bold mb-1 sm:mb-2">
                {pkg.name}
              </h3>
            ) : (
              <div className="text-xl sm:text-xl font-bold mb-1 sm:mb-2">
                {pkg.name}
              </div>
            )}

            {/* Review Rating */}
            {aggregateRating && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < Math.floor(aggregateRating.average)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">{aggregateRating.average}</span>
                <span className="text-xs text-muted-foreground font-medium">({aggregateRating.count})</span>
              </div>
            )}

            <div className="flex flex-wrap justify-start gap-x-2 gap-y-1">
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-lg sm:text-sm">
                <Clock className="w-4 h-4 sm:w-4 sm:h-4 text-primary" />
                <span className="font-medium whitespace-nowrap">{pkg.duration}</span>
              </div>
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-lg sm:text-sm">
                <ImageIcon className="w-4 h-4 sm:w-4 sm:h-4 text-primary" />
                <span className="font-medium whitespace-nowrap">{pkg.photos} {tui("photos")}</span>
              </div>
              <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-lg sm:text-sm">
                <MapPin className="w-4 h-4 sm:w-4 sm:h-4 text-primary" />
                <span className="font-medium whitespace-nowrap">{pkg.locations} {tui("locations")}</span>
              </div>
            </div>
            <div />
          </CardHeader>
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
                {packages.map((pkg) => (
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
            {packages.map((pkg) => (
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
