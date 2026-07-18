"use client";

import { ArrowRight, Clock, MapPin } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { LocationDB } from "@/lib/locations-service";
import { useLocale, useTranslations } from "next-intl";
import { generateNativeSlug } from "@/lib/slug-generator";

interface LocationCardProps {
  location: LocationDB;
  index: number;
  parentSlug?: string;
}

export function LocationCard({ location, index, parentSlug }: LocationCardProps) {

  const locale = useLocale();
  const t = useTranslations("locations");

  const dynamicTitle = location.title?.[locale] || location.title?.en || "";
  const dynamicDesc = location.description?.[locale] || location.description?.en || "";
  const dynamicBestTime = location.best_time?.[locale] || location.best_time?.en || "";
  const dynamicSlug = dynamicTitle ? (generateNativeSlug(dynamicTitle) || location.slug) : location.slug;

  const baseHref = `/${locale}/${parentSlug || "locations"}/${dynamicSlug}`;

  return (
    <div className="h-full cursor-pointer">
      <Link
        href={baseHref}
        className="block group h-full"
      >
        <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-lg border-border/50 bg-card/80 backdrop-blur-sm py-0 gap-0">
          {/* Image Container - More compact aspect ratio */}
          <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
            {location.cover_image && (
              <Image
                src={location.cover_image}
                alt={dynamicTitle}
                fill
                className="object-cover object-center transition-transform duration-500 hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                priority={index < 4}
                quality={75}
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Tags - Top Left */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-wrap gap-1.5 max-w-[70%]">
              {location.tags
                .flatMap(t => t.split(',').map(s => s.trim()).filter(Boolean))
                .slice(0, 2)
                .map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-background/85 backdrop-blur-md text-foreground border-border/50 text-[10px] sm:text-xs font-medium px-2 py-0.5 shadow-sm capitalize"
                  >
                    {tag.replace(/-/g, ' ')}
                  </Badge>
                ))}
            </div>

            {/* Best Time Badge - Top Right */}
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
              <Badge className="bg-primary/95 hover:bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium shadow-lg">
                <Clock className="w-3 h-3 mr-1" />
                {dynamicBestTime}
              </Badge>
            </div>

            {/* Location Name on Image - Bottom Left */}
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
              <h3 className="text-white text-base sm:text-lg font-bold drop-shadow-lg">
                {dynamicTitle}
              </h3>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-3 sm:p-4">
            {/* Description */}
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem] sm:min-h-[2.75rem]">
              {dynamicDesc}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary/70" />
                  <span>{location.coordinates ? `${location.coordinates.lat.toFixed(2)}, ${location.coordinates.lng.toFixed(2)}` : t("explore")}</span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform duration-300">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
