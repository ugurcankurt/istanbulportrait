"use client";

import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Clock,
  Banknote,
  Image as ImageIcon,
  MapPin,
  Telescope,
  Star,
  Share2,
  Heart,
  Camera,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useDateFnsLocale } from "@/hooks/use-date-fns-locale";
import dynamic from "next/dynamic";
import { BookingCard } from "@/components/booking-card";
import { PackageGallery } from "@/components/package-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BookingModal = dynamic(
  () => import("@/components/booking-modal").then((mod) => mod.BookingModal),
  { ssr: false },
);
import { trackViewItem } from "@/lib/analytics";
import {
  calculateDiscountedPrice,
  matchActiveSurcharge,
  getPackagePricing,
} from "@/lib/pricing";
import { extractPhotosCount } from "@/lib/features-parser";
import type { PackageDB } from "@/lib/packages-service";
import type { LocationDB } from "@/lib/locations-service";
import type { DiscountDB } from "@/lib/discount-service";
import { PackageReviews } from "@/components/package-reviews";
import type { GoogleReview, AggregateRating } from "@/types/reviews";
import { cn } from "@/lib/utils";
import type { TimeSurcharge } from "@/lib/availability-service";
import { useCurrency } from "@/contexts/currency-context";
import { SchemaInjector } from "@/components/schema-injector";
import { buildTouristAttractionSchema, generateSeoDescription } from "@/lib/seo-utils";

export interface ProgrammaticSeoPageProps {
  packageData: PackageDB;
  locationData: LocationDB;
  aggregateRating: AggregateRating;
  reviews: GoogleReview[];
  activeDiscount: DiscountDB | null;
  timeSurcharges: TimeSurcharge[];
  whatsappNumber?: string;
  baseUrl: string;
}

export function ProgrammaticSeoPage({
  packageData,
  locationData,
  aggregateRating,
  reviews,
  activeDiscount,
  timeSurcharges,
  whatsappNumber,
  baseUrl,
}: ProgrammaticSeoPageProps) {
  const t = useTranslations("packages");
  const tReviews = useTranslations("reviews");
  const tui = useTranslations("ui");
  const tCheckout = useTranslations("checkout");
  const tLoc = useTranslations("locations");
  const locale = useLocale();
  const { formatPrice, currency, convertPrice } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFnsLocale = useDateFnsLocale();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [isSaved, setIsSaved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [yieldMultiplier, setYieldMultiplier] = useState<number>(0.7);
  const [yieldReason, setYieldReason] = useState<string>("early_bird");

  if (!packageData || !locationData) return null;

  const activeSurcharge = matchActiveSurcharge(selectedTime, timeSurcharges);
  const surchargePercentage = activeSurcharge ? activeSurcharge.surcharge_percentage : 0;

  const basePrice = Number(packageData.price);
  const pricing = calculateDiscountedPrice(
    basePrice * (1 + surchargePercentage / 100) * yieldMultiplier,
    activeDiscount,
    null,
    selectedDate,
  );

  const fullPricing = getPackagePricing(
    packageData.slug as any,
    basePrice,
    activeDiscount,
    null,
    selectedDate,
    packageData.is_per_person ? peopleCount : undefined,
    undefined,
    undefined,
    surchargePercentage,
    yieldMultiplier,
  );

  const displayPrice = pricing.price;

  const features = packageData.features[locale] || packageData.features["en"] || [];
  
  const rawPackageName = packageData.title[locale] || packageData.title["en"] || packageData.slug;
  const locTitle = locationData.title?.[locale] || locationData.title?.en || locationData.slug;
  const packageName = `${rawPackageName} - ${locTitle}`; // Dynamic combination
  
  const packageDesc = packageData.description[locale] || packageData.description["en"] || "";
  const locDesc = locationData.description?.[locale] || locationData.description?.en || "";
  
  const packageDur = packageData.duration[locale] || packageData.duration["en"] || "1 Hour";
  
  // Use location images first, then fallback to package images
  const locGallery = locationData.gallery_images || [];
  const pkgGallery = packageData.gallery_images || [];
  let gallery = [...locGallery, ...pkgGallery];
  
  if (gallery.length === 0) {
    if (locationData.cover_image) gallery.push(locationData.cover_image);
    if (packageData.cover_image) gallery.push(packageData.cover_image);
  }
  
  const photographyTips = locationData.photography_tips?.[locale] || locationData.photography_tips?.en || [];

  useEffect(() => {
    trackViewItem(packageData.slug, packageName, convertPrice(pricing.price), currency);
  }, [packageData.slug, packageName, pricing.price, pricing.isDiscounted, basePrice, currency, convertPrice]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? tui("removed_from_saved") : tui("saved_to_favorites"));
  };

  const handleShare = async () => {
    const shareData = { title: packageName, text: packageDesc, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(tui("link_copied"));
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* --- DESKTOP HEADER --- */}
      <div className="hidden md:block pt-6 pb-2">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-serif text-foreground leading-tight">
                {packageName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
                {pricing.isDiscounted && (
                  <Badge variant="default" className="bg-black/80 text-white font-serif tracking-widest uppercase text-xs px-3 py-1">
                    {tui("save_percentage", { percentage: Math.round(pricing.discountPercentage * 100) })}
                  </Badge>
                )}
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-bold text-foreground">{aggregateRating.average}</span>
                </div>
                <button onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })} className="text-primary hover:underline font-bold decoration-2 underline-offset-4">
                  {aggregateRating.count} {tReviews("total_reviews")}
                </button>
                <div className="h-1 w-1 rounded-full bg-border hidden sm:block" />
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {locTitle}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" /> <span>{tui("share")}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={toggleSave}>
                <Heart className={cn("h-4 w-4", isSaved ? "fill-primary text-primary" : "text-muted-foreground")} />
                <span>{isSaved ? tui("saved") : tui("save")}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* --- LEFT COLUMN: GALLERY & CONTENT --- */}
          <div className="lg:col-span-8 space-y-8">
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

            {/* Mobile Header */}
            <div className="md:hidden space-y-6">
              <div className="text-4xl font-serif text-foreground leading-tight">
                {packageName}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground lowercase">
                  {t("starting_from")} /
                </span>
                <div className="text-4xl font-bold text-primary">
                  {formatPrice(pricing.price)}
                </div>
              </div>
            </div>

            {/* SEO Content Injection */}
            <div className="space-y-8">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl font-serif text-foreground">{tLoc("aboutLocation") || "About The Location"}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {locDesc}
                </p>
                <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border/50">
                  <p className="italic text-muted-foreground">
                    {packageDesc}
                  </p>
                </div>
              </div>

              {/* Package Features */}
              <div className="space-y-6 border-t pt-8">
                <h3 className="text-3xl font-serif flex items-center gap-3">
                  <Telescope className="h-6 w-6 text-primary" />
                  {tui("what_to_expect")}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-4 group">
                      <div className="mt-1 bg-primary/10 p-1.5 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Check className="h-3.5 w-3.5 text-primary stroke-[3]" />
                      </div>
                      <span className="text-lg font-medium text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Location Tips */}
              {photographyTips.length > 0 && (
                <div className="space-y-6 border-t pt-8">
                  <h3 className="text-3xl font-serif flex items-center gap-3">
                    <Camera className="h-6 w-6 text-primary" />
                    {tLoc("photographyTips")}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {photographyTips.map((tip, idx) => (
                      <div key={idx} className="bg-muted/20 p-4 rounded-xl border border-border/50">
                        <p className="text-sm text-muted-foreground">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN: BOOKING --- */}
          <div className="lg:col-span-4">
            <div className="hidden lg:block lg:sticky lg:top-28">
              <BookingCard
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
                onCheckAvailability={() => setIsModalOpen(true)}
                activeDiscount={activeDiscount}
                timeSurcharges={timeSurcharges}
                whatsappNumber={whatsappNumber}
                onYieldChange={(multiplier, reason) => {
                  setYieldMultiplier(multiplier);
                  setYieldReason(reason);
                }}
                yieldReason={yieldReason}
              />
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
        initialDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
        initialTime={selectedTime}
        initialPeopleCount={peopleCount}
        packageDuration={packageDur}
        packageLocations={packageData.locations || 1}
        packageFeatures={features}
        packagePhotos={packageData.gallery_images?.length || 15}
        isPerPerson={packageData.is_per_person}
        activeDiscount={activeDiscount}
        timeSurcharges={timeSurcharges}
        whatsappNumber={whatsappNumber}
        yieldMultiplier={yieldMultiplier}
        yieldReason={yieldReason}
      />

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
            onClick={() => setIsModalOpen(true)}
          >
            {tui("book_package")}
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 border-t mt-8">
        <PackageReviews reviews={reviews} aggregateRating={aggregateRating} />
      </div>
    </div>
  );
}
