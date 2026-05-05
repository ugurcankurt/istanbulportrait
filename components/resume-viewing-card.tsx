"use client";

import { useEffect, useState } from "react";
import { Clock, History, Images } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { generateNativeSlug } from "@/lib/slug-generator";
import { calculateDiscountedPrice } from "@/lib/pricing";
import type { PackageId } from "@/lib/validations";
import { usePackagesStore } from "@/stores/packages-store";
import type { DiscountDB } from "@/lib/discount-service";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { enUS, tr, de, fr, es, zhCN, ro, arSA, ru } from "date-fns/locale";
import { useLocale } from "next-intl";
import { useCurrency } from "@/contexts/currency-context";
import { cn } from "@/lib/utils";
import { extractPhotosCount } from "@/lib/features-parser";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export interface LastVisited {
  id: PackageId;
  timestamp: number;
}

interface ResumeViewingCardProps {
  visitedPackages?: LastVisited[];
  showTitle?: boolean;
  withContainer?: boolean;
  isMainTitle?: boolean;
  activeDiscount?: DiscountDB | null;
}

export function ResumeViewingCard({
  visitedPackages: initialPackages,
  showTitle = true,
  withContainer = true,
  isMainTitle = false,
  activeDiscount = null,
}: ResumeViewingCardProps) {
  const [localVisited, setLocalVisited] = useState<LastVisited[]>([]);
  const t = useTranslations("packages");
  const thero = useTranslations("hero");
  const tui = useTranslations("ui");

  const visitedPackages = initialPackages ?? localVisited;
  const { packages, fetchPackages } = usePackagesStore();

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    if (!initialPackages) {
      const stored = localStorage.getItem("visited_packages");
      if (stored) {
        try {
          const data: LastVisited[] = JSON.parse(stored);
          const now = Date.now();
          const thirtySixHours = 36 * 60 * 60 * 1000;

          const validPackages = data.filter((p) => now - p.timestamp < thirtySixHours);
          setLocalVisited(validPackages);

          if (validPackages.length !== data.length) {
            localStorage.setItem("visited_packages", JSON.stringify(validPackages));
          }
        } catch (e) {
          console.error("Error parsing visited_packages", e);
        }
      }
    }
  }, [initialPackages]);

  const locale = useLocale();
  const { formatPrice } = useCurrency();

  const getDateLocale = (code: string) => {
    switch (code) {
      case "tr": return tr;
      case "de": return de;
      case "fr": return fr;
      case "es": return es;
      case "zh": return zhCN;
      case "ro": return ro;
      case "ar": return arSA;
      case "ru": return ru;
      default: return enUS;
    }
  };

  if (visitedPackages.length === 0) return null;

  const today = new Date();

  // Only enable loop and duplication if we have enough items to avoid seeing the same item twice in the same view
  const isLoopable = visitedPackages.length > 3;

  // Ensure we have enough items for a smooth infinite loop when loop is enabled
  // If we have few items (but enough to loop), repeat them to fill the carousel
  const displayPackages = isLoopable && visitedPackages.length < 8
    ? Array.from({ length: Math.ceil(8 / visitedPackages.length) })
      .flatMap(() => visitedPackages)
    : visitedPackages;

  const content = (
    <div className={cn("flex flex-col gap-8", !withContainer && "w-full")}>
      {showTitle && (
        isMainTitle ? (
          <h2 className="font-serif text-3xl sm:text-4xl text-white drop-shadow-lg text-center tracking-tight">
            {thero("resume_title")}
          </h2>
        ) : (
          <div className="font-serif text-3xl sm:text-4xl text-white drop-shadow-lg text-center tracking-tight">
            {thero("resume_title")}
          </div>
        )
      )}

      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: isLoopable,
            skipSnaps: false,
            breakpoints: {
              "(min-width: 640px)": { align: "start" },
            },
          }}
          className="w-full"
        >
          <CarouselContent className="-ms-2 md:-ms-4">
            {displayPackages.map((visited, index) => {
              const packageId = visited.id as PackageId;
              const packageDb = packages.find((p) => p.slug === packageId);

              const basePrice = packageDb ? Number(packageDb.price) : 150;
              const pricing = calculateDiscountedPrice(basePrice, activeDiscount, null, today);

              // Use dynamic translations
              const locFeatures = packageDb?.features[locale] || packageDb?.features["en"] || [];
              const locName = packageDb?.title[locale] || packageDb?.title["en"] || packageDb?.slug || packageId;
              const locDuration = packageDb?.duration[locale] || packageDb?.duration["en"] || "";
              const locPhotos = extractPhotosCount(locFeatures);
              const packageImage = packageDb?.cover_image || "";

              const nativeSlug = packageDb?.title[locale] ? generateNativeSlug(packageDb.title[locale]) : (packageDb?.slug || packageId);

              return (
                <CarouselItem key={`${packageId}-${index}`} className="ps-2 md:ps-4 basis-[88%] sm:basis-1/2 lg:basis-[92%]">
                  <Link
                    href={`/${locale}/packages/${nativeSlug}`}
                    className="group block w-full"
                  >
                    <Card className="relative flex flex-row overflow-hidden p-2 gap-4 border-[0.5px] border-border/50 bg-white text-black transition-all duration-500 shadow-lg hover:shadow-xl rounded-[2rem] h-[120px] sm:h-[140px]">
                      {/* History Badge - Absolute Top Left */}
                      <div className="absolute top-3 start-3 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-black/60 text-white backdrop-blur-md px-3 py-1.5 rounded-full z-10 border border-white/20">
                        <History className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(visited.timestamp, {
                            addSuffix: true,
                            locale: getDateLocale(locale),
                          })}
                        </span>
                      </div>

                      <div className="relative w-32 sm:w-40 h-full overflow-hidden shrink-0 rounded-xl">
                        {packageImage ? (
                          <Image
                            src={packageImage}
                            alt={locName}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 150px, 200px"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                            <Images className="w-6 h-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="flex-1 flex flex-col justify-between p-0 py-1 pe-2 uppercase-none">
                        <div className="space-y-1">
                          <div className="font-serif text-base sm:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 text-slate-900">
                            {locName}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{locDuration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Images className="w-3 h-3" />
                              <span>{locPhotos} {tui("photos")}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-2 mt-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg sm:text-xl font-bold text-slate-900">
                              {formatPrice(pricing.price)}
                            </span>
                            {pricing.isDiscounted && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(basePrice)}
                              </span>
                            )}
                          </div>
                          {pricing.isDiscounted && activeDiscount && (
                            <span className="text-[10px] font-bold text-sale bg-sale/10 px-2 py-0.5 rounded-full animate-pulse whitespace-nowrap">
                              -{Math.round(pricing.discountPercentage * 100)}% {activeDiscount.name}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          {visitedPackages.length > 3 && (
            <>
              <CarouselPrevious className="hidden xl:flex bg-white/10 border-white/20 hover:bg-white/20 text-white" />
              <CarouselNext className="hidden xl:flex bg-white/10 border-white/20 hover:bg-white/20 text-white" />
            </>
          )}
        </Carousel>
      </div>
    </div>
  );

  if (withContainer) {
    return (
      <section className="py-8 sm:py-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 fill-mode-both">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {content}
        </div>
      </section>
    );
  }

  return content;
}
