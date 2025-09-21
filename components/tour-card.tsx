"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Star, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { formatTourPrice, viatorAPI } from "@/lib/viator";
import type { ViatorProduct } from "@/types/viator";

interface TourCardProps {
  tour: ViatorProduct;
  locale: string;
  className?: string;
  showBookButton?: boolean;
}

export function TourCard({
  tour,
  locale,
  className = "",
  showBookButton = true,
}: TourCardProps) {
  const t = useTranslations("tours");

  const handleBookClick = () => {
    try {
      const bookingUrl = viatorAPI.buildBookingUrl(tour, locale);

      // Track click event for analytics
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "tour_booking_click", {
          tour_name: tour.title,
          tour_price: tour.pricing.summary.fromPrice,
          currency: tour.pricing.currency,
          locale: locale,
        });
      }

      window.open(bookingUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error generating booking URL:", error);
      }
      // Fallback to direct product URL if available
      if (tour.productUrl) {
        window.open(tour.productUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className="h-full overflow-hidden border-0 bg-white shadow-lg transition-all duration-200 hover:shadow-xl dark:bg-gray-900 p-0">
        {/* Image Section - Direct inside Card with no spacing */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
          <Image
            src={
              tour.images?.[0]?.variants?.find((v) => v.height >= 400)?.url ||
              tour.images?.[0]?.variants?.[0]?.url ||
              "/placeholder-tour.jpg"
            }
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Rating Badge */}
          <div className="absolute left-3 top-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-900">
              <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
              {tour.reviews.combinedAverageRating.toFixed(1)}
            </Badge>
          </div>

          {/* Flags Badge */}
          {tour.flags && tour.flags.includes("LIKELY_TO_SELL_OUT") && (
            <div className="absolute right-3 top-3">
              <Badge variant="destructive" className="bg-red-500 text-white">
                {t("likelyToSellOut")}
              </Badge>
            </div>
          )}

          {/* Review Count */}
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="bg-black/60 text-white">
              {tour.reviews.totalReviews} {t("reviews")}
            </Badge>
          </div>
        </div>

        <CardContent className="flex-1 px-4 pt-4 pb-2">
          <div className="space-y-3">
            {/* Title */}
            <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
              {tour.title}
            </h3>

            {/* Description */}
            <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
              {tour.description}
            </p>

            {/* Tour Details */}
            <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {tour.duration.fixedDurationInMinutes
                    ? `${Math.floor(tour.duration.fixedDurationInMinutes / 60)}h ${tour.duration.fixedDurationInMinutes % 60}m`
                    : tour.duration.variableDurationFromMinutes
                      ? `${Math.floor(tour.duration.variableDurationFromMinutes / 60)}-${Math.floor((tour.duration.variableDurationToMinutes || tour.duration.variableDurationFromMinutes) / 60)}h`
                      : "Duration varies"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Istanbul</span>
              </div>

              {tour.confirmationType && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{tour.confirmationType}</span>
                </div>
              )}
            </div>

            {/* Flags */}
            {tour.flags && tour.flags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tour.flags.slice(0, 2).map((flag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {flag.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-1">
          {/* Price Section */}
          <div className="flex w-full items-end justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("fromPrice")}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-primary">
                  {formatTourPrice(
                    tour.pricing.summary.fromPrice,
                    tour.pricing.currency,
                  )}
                </p>
                {tour.pricing.summary.fromPriceBeforeDiscount &&
                  tour.pricing.summary.fromPriceBeforeDiscount >
                    tour.pricing.summary.fromPrice && (
                    <p className="text-sm text-gray-500 line-through">
                      {formatTourPrice(
                        tour.pricing.summary.fromPriceBeforeDiscount,
                        tour.pricing.currency,
                      )}
                    </p>
                  )}
              </div>
            </div>

            {/* Compact Action Button - Right Aligned */}
            {showBookButton && (
              <Button
                onClick={handleBookClick}
                size="default"
                className="px-6 py-2 shrink-0"
              >
                {t("bookNow")}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// Loading skeleton component
export function TourCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Card className="h-full overflow-hidden border-0 bg-white shadow-lg dark:bg-gray-900 p-0">
        {/* Image Section - Direct inside Card */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse rounded-t-lg" />

        <CardContent className="flex-1 px-4 pt-4 pb-2">
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-1">
          <div className="flex w-full items-end justify-between">
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-16 dark:bg-gray-700 animate-pulse" />
              <div className="h-7 bg-gray-200 rounded w-24 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="h-9 bg-gray-200 rounded w-24 dark:bg-gray-700 animate-pulse" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
