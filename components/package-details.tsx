"use client";

import { format } from "date-fns";
import {
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Heart,
  Image as ImageIcon,
  MapPin,
  Share2,
  Star,
  Telescope,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BookingCard } from "@/components/booking-card";
import { PackageGallery } from "@/components/package-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDateFnsLocale } from "@/hooks/use-date-fns-locale";

const BookingModal = dynamic(
  () => import("@/components/booking-modal").then((mod) => mod.BookingModal),
  { ssr: false },
);

import { PackageReviews } from "@/components/package-reviews";
import { useCurrency } from "@/contexts/currency-context";
import type { AddonDB } from "@/lib/addons-service";
import { trackViewItem } from "@/lib/analytics";
import type { TimeSurcharge } from "@/lib/availability-service";
import type { DiscountDB } from "@/lib/discount-service";
import { extractPhotosCount } from "@/lib/features-parser";
import type { PackageDB } from "@/lib/packages-service";
import { getPackagePricing, matchActiveSurcharge } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { AggregateRating, GoogleReview } from "@/types/reviews";

export interface PackageDetailsProps {
  packageData: PackageDB;
  aggregateRating: AggregateRating;
  reviews: GoogleReview[];
  activeDiscounts: DiscountDB[] | null;
  timeSurcharges: TimeSurcharge[];
  availableAddons?: AddonDB[];
  whatsappNumber?: string;
}

export function PackageDetails({
  packageData,
  aggregateRating,
  reviews,
  activeDiscounts,
  timeSurcharges,
  availableAddons = [],
  whatsappNumber,
}: PackageDetailsProps) {
  const t = useTranslations("packages");
  const tReviews = useTranslations("reviews");
  const tui = useTranslations("ui");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const { formatPrice, currency, convertPrice } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFnsLocale = useDateFnsLocale();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  );
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonQuantities, setAddonQuantities] = useState<
    Record<string, number>
  >({});
  const [isSaved, setIsSaved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [yieldMultiplier, setYieldMultiplier] = useState<number>(1.0);
  const [yieldReason, setYieldReason] = useState<string>("standard");
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (searchParams.get("book") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Calculate surcharge if specific time is selected
  const activeSurcharge = matchActiveSurcharge(selectedTime, timeSurcharges);
  const surchargePercentage = activeSurcharge
    ? activeSurcharge.surcharge_percentage
    : 0;

  // Calculate generic unit pricing for display
  const basePrice = packageData ? Number(packageData.price) : 0;

  // Calculate full dynamic pricing including people count for the correct deposit logic
  const fullPricing = packageData
    ? getPackagePricing(
        packageData.slug as any,
        basePrice,
        activeDiscounts,
        null,
        selectedDate,
        peopleCount,
        undefined,
        undefined,
        surchargePercentage,
        yieldMultiplier,
        availableAddons,
        selectedAddons,
        packageData.is_per_person,
        addonQuantities,
      )
    : null;

  const displayPrice =
    packageData && fullPricing
      ? packageData.is_per_person && peopleCount > 0
        ? fullPricing.totalPrice / peopleCount
        : fullPricing.totalPrice
      : 0;

  const originalDisplayPrice =
    packageData && fullPricing
      ? packageData.is_per_person && peopleCount > 0
        ? fullPricing.originalPrice / peopleCount
        : fullPricing.originalPrice
      : 0;

  const pricing = {
    price: displayPrice,
    originalPrice: originalDisplayPrice,
    isDiscounted: fullPricing?.isDiscounted ?? false,
    discountPercentage: fullPricing?.appliedDiscountPercentage ?? 0,
    depositAmount: fullPricing?.depositAmount ?? 0,
    remainingAmount: fullPricing?.remainingAmount ?? 0,
  };

  const features = packageData
    ? packageData.features[locale] || packageData.features.en || []
    : [];
  const packageName = packageData
    ? packageData.title[locale] || packageData.title.en || packageData.slug
    : "";
  const packageDesc = packageData
    ? packageData.description[locale] || packageData.description.en || ""
    : "";
  const packageDur = packageData
    ? packageData.duration[locale] || packageData.duration.en || "1 Hour"
    : "1 Hour";
  const gallery = packageData
    ? packageData.gallery_images && packageData.gallery_images.length > 0
      ? packageData.gallery_images
      : packageData.cover_image
        ? [packageData.cover_image]
        : []
    : [];

  useEffect(() => {
    if (!packageData) return;
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      trackViewItem(packageData.slug, packageName, pricing.price, "EUR");
    }
  }, [packageData, packageName, pricing.price]);

  useEffect(() => {
    if (!packageData) return;
    const savedPackages = JSON.parse(
      localStorage.getItem("saved_packages") || "[]",
    );
    setIsSaved(savedPackages.includes(packageData.slug));

    // Track visited packages for Hero personalization
    const visited = JSON.parse(
      localStorage.getItem("visited_packages") || "[]",
    );
    const updated = [
      { id: packageData.slug, timestamp: Date.now() },
      ...visited.filter((p: any) => p.id !== packageData.slug),
    ].slice(0, 4);
    localStorage.setItem("visited_packages", JSON.stringify(updated));
  }, [packageData]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!packageData || !fullPricing) return null;

  const toggleSave = () => {
    const savedPackages = JSON.parse(
      localStorage.getItem("saved_packages") || "[]",
    );
    let newSaved;
    if (isSaved) {
      newSaved = savedPackages.filter((id: string) => id !== packageData.slug);
      toast.success(tui("removed_from_saved"));
    } else {
      newSaved = [...savedPackages, packageData.slug];
      toast.success(tui("saved_to_favorites"));
    }
    localStorage.setItem("saved_packages", JSON.stringify(newSaved));
    setIsSaved(!isSaved);
  };

  const handleShare = async () => {
    const shareData = {
      title: packageName,
      text: packageDesc,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(tui("link_copied"));
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-6 md:gap-y-8 lg:gap-x-10 items-start">
          {/* --- UNIFIED RESPONSIVE HEADER (Single visible <h1> on both Mobile & Desktop) --- */}
          <div className="order-2 md:order-1 lg:col-span-12">
            {/* Mobile-only top badges */}
            <div className="flex md:hidden flex-wrap items-center gap-x-2 gap-y-2 text-sm mb-3">
              <Badge
                variant="secondary"
                className="bg-primary/5 text-primary border-[0.5px] border-primary/20 tracking-wider uppercase text-[10px] px-3 py-1 shadow-sm font-medium"
              >
                {tui("professional_photographer")}
              </Badge>
              {packageData.is_popular && (
                <Badge className="bg-black/80 backdrop-blur-md text-white border border-white/20 tracking-wider uppercase text-[10px] px-3 py-1 shadow-luxury font-medium">
                  {tui("most_popular")}
                </Badge>
              )}
              {packageData.is_per_person && (
                <Badge className="bg-primary/10 text-primary border-[0.5px] border-primary/20 tracking-wider uppercase text-[10px] px-3 py-1 shadow-sm font-medium">
                  👤 {t("per_person")}
                </Badge>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="space-y-3 md:space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-serif font-normal text-foreground leading-[1.12] tracking-tight text-balance">
                  {packageName}
                </h1>

                {/* Desktop meta row */}
                <div className="hidden md:flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
                  {pricing.isDiscounted && (
                    <Badge
                      variant="default"
                      className="bg-red-600/90 backdrop-blur-md text-white border border-red-500 tracking-wider uppercase text-xs px-3 py-1 shadow-sm font-medium"
                    >
                      {tui("save_percentage", {
                        percentage: Math.round(
                          pricing.discountPercentage * 100,
                        ),
                      })}
                    </Badge>
                  )}
                  {packageData.is_per_person && (
                    <Badge className="bg-primary/10 text-primary border-[0.5px] border-primary/20 tracking-wider uppercase text-[10px] px-3 py-1 shadow-sm font-medium">
                      👤 {t("per_person")}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < Math.floor(aggregateRating.average)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-foreground">
                      {aggregateRating.average}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("reviews")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="text-primary hover:underline font-bold decoration-2 underline-offset-4"
                  >
                    {aggregateRating.count} {tReviews("total_reviews")}
                  </button>
                  <div className="h-1 w-1 rounded-full bg-border hidden sm:block" />
                  <span className="text-muted-foreground font-medium">
                    {tui("professional_photographer")}
                  </span>
                </div>

                {/* Mobile rating, price & quick stats */}
                <div className="md:hidden space-y-4 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < Math.floor(aggregateRating.average)
                              ? "fill-primary text-primary"
                              : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById("reviews")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="text-sm font-bold text-primary hover:underline underline-offset-4"
                    >
                      {aggregateRating.average} ({aggregateRating.count}{" "}
                      {tReviews("total_reviews")})
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground font-medium lowercase">
                        {t("starting_from")} /
                      </span>
                      <div className="text-3xl sm:text-4xl font-serif font-semibold text-primary tracking-tight">
                        {formatPrice(pricing.price)}
                      </div>
                      {pricing.isDiscounted && (
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-lg sm:text-xl text-muted-foreground line-through font-medium">
                            {formatPrice(pricing.originalPrice)}
                          </span>
                          <Badge className="bg-red-600/90 backdrop-blur-md text-white border border-red-500 tracking-wider uppercase text-xs px-2.5 py-0.5 shadow-sm font-medium">
                            {tui("save_percentage", {
                              percentage: Math.round(
                                pricing.discountPercentage * 100,
                              ),
                            })}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats Grid (Mobile) */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {[
                      { icon: Clock, label: tui("duration"), val: packageDur },
                      {
                        icon: ImageIcon,
                        label: tui("photos"),
                        val: extractPhotosCount(features),
                      },
                      {
                        icon: MapPin,
                        label: tui("locations"),
                        val: packageData.locations || 1,
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-muted/40 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/50"
                      >
                        <stat.icon className="h-5 w-5 text-primary mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          {stat.label}
                        </span>
                        <span className="text-sm font-bold">{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Share & Save */}
              <div className="hidden md:flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  <span>{tui("share")}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={toggleSave}>
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isSaved
                        ? "fill-primary text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span>{isSaved ? tui("saved") : tui("save")}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* --- GALLERY (Mobile: top / Desktop: left 8 cols below header) --- */}
          <div className="order-1 md:order-2 lg:col-span-8">
            <PackageGallery
              packageSlug={packageData.slug}
              images={gallery}
              alt={packageName}
              onShare={handleShare}
              onFavorite={toggleSave}
              onBack={() => router.back()}
              isFavorite={isSaved}
              videoUrl={packageData.video_url}
            />
          </div>

          {/* --- DESKTOP STICKY BOOKING CARD (Right 4 cols spanning Gallery + Description) --- */}
          <div className="hidden lg:block lg:order-2 lg:col-span-4 lg:row-span-2 lg:sticky lg:top-28">
            <BookingCard
              idPrefix="desktop-"
              packageId={packageData.slug as any}
              packageDisplayName={packageName}
              basePrice={basePrice}
              pricing={{
                price: pricing.price,
                isDiscounted: pricing.isDiscounted,
                discountPercentage: pricing.discountPercentage,
                depositAmount: fullPricing.depositAmount,
                remainingAmount: fullPricing.remainingAmount,
                originalPrice: pricing.originalPrice,
              }}
              displayPrice={displayPrice}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              peopleCount={peopleCount}
              setPeopleCount={setPeopleCount}
              dateFnsLocale={dateFnsLocale}
              tCheckout={tCheckout}
              t={t}
              packageDuration={packageDur}
              isPerPerson={packageData.is_per_person}
              onCheckAvailability={() => {
                // add_to_cart fires once from BookingModal on open
                setIsModalOpen(true);
              }}
              activeDiscounts={activeDiscounts}
              timeSurcharges={timeSurcharges}
              availableAddons={availableAddons}
              whatsappNumber={whatsappNumber}
              selectedAddons={selectedAddons}
              setSelectedAddons={setSelectedAddons}
              addonQuantities={addonQuantities}
              setAddonQuantities={setAddonQuantities}
              onYieldChange={(multiplier, reason) => {
                setYieldMultiplier(multiplier);
                setYieldReason(reason);
              }}
              yieldReason={yieldReason}
            />
          </div>

          {/* --- SHARED DESCRIPTION & WHAT TO EXPECT (Left 8 cols) --- */}
          <div className="order-3 lg:col-span-8 space-y-8">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed italic border-s-4 border-primary/30 ps-5 sm:ps-6 py-2">
                {packageDesc}
              </p>
            </div>

            <div className="space-y-6 border-t pt-8">
              <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground tracking-tight flex items-center gap-3">
                <Telescope className="h-6 w-6 text-primary" />
                {tui("what_to_expect")}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-5 gap-x-8 sm:gap-x-12">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 sm:gap-4 group"
                  >
                    <div className="mt-1 bg-primary/10 p-1.5 rounded-full group-hover:bg-primary/20 transition-colors shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary stroke-[3]" />
                    </div>
                    <span className="text-base sm:text-lg font-normal text-foreground/90 leading-snug">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPackage={packageData.slug as any}
        basePrice={basePrice}
        packageDisplayName={packageName}
        initialDate={
          selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined
        }
        initialTime={selectedTime}
        initialPeopleCount={peopleCount}
        packageDuration={packageDur}
        packageLocations={packageData.locations || 1}
        packageFeatures={features}
        packagePhotos={
          extractPhotosCount(features) ||
          packageData.gallery_images?.length ||
          15
        }
        isPerPerson={packageData.is_per_person}
        activeDiscounts={activeDiscounts}
        timeSurcharges={timeSurcharges}
        whatsappNumber={whatsappNumber}
        yieldMultiplier={yieldMultiplier}
        yieldReason={yieldReason}
        availableAddons={availableAddons}
        initialSelectedAddons={selectedAddons}
        initialAddonQuantities={addonQuantities}
      />

      {/* Existing Sticky Bottom Bar for Mobile (Hidden on Desktop) */}
      {/* Mobile Sticky Booking Interface */}
      <div
        className="lg:hidden fixed inset-x-0 z-40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300"
        style={{ bottom: "var(--cookie-banner-height, 0px)" }}
      >
        {/* Info Rows - Collapsible on Scroll */}
        <div
          className={cn(
            "transition-all duration-500 ease-in-out overflow-hidden border-b border-border/50 px-4",
            isScrolled
              ? "max-h-0 py-0 opacity-0 border-none"
              : "max-h-40 py-3 opacity-100",
          )}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground leading-tight">
                  {tCheckout("cancellation.title")}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground leading-tight line-clamp-1">
                  {tCheckout("cancellation.description")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Banknote className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground leading-tight">
                  {tCheckout("payment_methods.cash")}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground leading-tight">
                  {tCheckout("payment_methods.cash_description")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 flex items-center justify-between gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-muted-foreground lowercase">
                {t("starting_from")} /
              </span>
              <span className="text-2xl font-black text-primary">
                {formatPrice(pricing.price)}
              </span>
              {pricing.isDiscounted && (
                <span className="text-sm line-through text-muted-foreground font-medium opacity-60 ml-1">
                  {formatPrice(pricing.originalPrice)}
                </span>
              )}
            </div>
          </div>
          <Button
            size="lg"
            className="flex-1 max-w-[180px] h-12 text-sm font-black"
            onClick={() => {
              // add_to_cart fires once from BookingModal on open
              setIsModalOpen(true);
            }}
          >
            {tui("book_package")}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <PackageReviews reviews={reviews} aggregateRating={aggregateRating} />
      </div>
    </div>
  );
}
