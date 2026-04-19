"use client"

import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Image as ImageIcon,
  MapPin,
  Telescope,
  Star,
  Share2,
  Heart,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { ar, de, enUS, es, fr, ro, ru, tr as trLocale, zhCN } from "date-fns/locale";
import { BookingModal } from "@/components/booking-modal";
import { BookingCard } from "@/components/booking-card";
import { PackageGallery } from "@/components/package-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trackViewItem } from "@/lib/analytics";
import { calculateDiscountedPrice, DEPOSIT_PERCENTAGE } from "@/lib/pricing";
import { extractPhotosCount } from "@/lib/features-parser";
import type { PackageDB } from "@/lib/packages-service";
import type { DiscountDB } from "@/lib/discount-service";
import { PackageReviews } from "@/components/package-reviews";
import type { GoogleReview, AggregateRating } from "@/types/reviews";
import { cn } from "@/lib/utils";

export interface PackageDetailsProps {
  packageData: PackageDB;
  aggregateRating: AggregateRating;
  reviews: GoogleReview[];
  activeDiscount: DiscountDB | null;
}

const getDateFnsLocale = (locale: string) => {
  switch (locale) {
    case "ar": return ar;
    case "es": return es;
    case "ru": return ru;
    case "fr": return fr;
    case "de": return de;
    case "zh": return zhCN;
    case "ro": return ro;
    case "tr": return trLocale;
    default: return enUS;
  }
};

export function PackageDetails({ packageData, aggregateRating, reviews, activeDiscount }: PackageDetailsProps) {
  const t = useTranslations("packages");
  const tReviews = useTranslations("reviews");
  const tui = useTranslations("ui");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const dateFnsLocale = useMemo(() => getDateFnsLocale(locale), [locale]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [isSaved, setIsSaved] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  if (!packageData) return null;

  // Calculate pricing
  const basePrice = Number(packageData.price);
  const pricing = calculateDiscountedPrice(basePrice, activeDiscount, null, selectedDate);

  // Price to display (unit price, do not multiply by peopleCount for visual display)
  const displayPrice = pricing.price;

  const features = packageData.features[locale] || packageData.features["en"] || [];
  const packageName = packageData.title[locale] || packageData.title["en"] || packageData.slug;
  const packageDesc = packageData.description[locale] || packageData.description["en"] || "";
  const packageDur = packageData.duration[locale] || packageData.duration["en"] || "1 Hour";
  const gallery = packageData.gallery_images && packageData.gallery_images.length > 0
    ? packageData.gallery_images
    : (packageData.cover_image ? [packageData.cover_image] : []);

  useEffect(() => {
    trackViewItem(
      packageData.slug,
      packageName,
      pricing.isDiscounted ? pricing.price : basePrice,
    );
  }, [packageData.slug, packageName, pricing.price, pricing.isDiscounted, basePrice]);

  useEffect(() => {
    const savedPackages = JSON.parse(localStorage.getItem("saved_packages") || "[]");
    setIsSaved(savedPackages.includes(packageData.slug));

    // Track visited packages for Hero personalization
    const visited = JSON.parse(localStorage.getItem("visited_packages") || "[]");
    const updated = [
      { id: packageData.slug, timestamp: Date.now() },
      ...visited.filter((p: any) => p.id !== packageData.slug),
    ].slice(0, 4);
    localStorage.setItem("visited_packages", JSON.stringify(updated));
  }, [packageData.slug]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSave = () => {
    const savedPackages = JSON.parse(localStorage.getItem("saved_packages") || "[]");
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
    <div className="flex flex-col min-h-screen bg-background">
      {/* --- DESKTOP HEADER (md:block) --- */}
      <div className="hidden md:block border-b bg-background/85 backdrop-blur-sm sticky top-16 z-30">
        <div className="container mx-auto px-4 py-4 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
                {packageName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
                {pricing.isDiscounted && (
                  <Badge variant="default" className="bg-sale border-none text-white animate-pulse">
                    {tui("save_percentage", { percentage: Math.round(pricing.discountPercentage * 100) })}
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
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-foreground">{aggregateRating.average}</span>
                </div>
                <button
                  onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-primary hover:underline font-bold decoration-2 underline-offset-4"
                >
                  {aggregateRating.count} {tReviews("total_reviews")}
                </button>
                <div className="h-1 w-1 rounded-full bg-border hidden sm:block" />
                <span className="text-muted-foreground font-medium">
                  {tui("professional_photographer")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                <span>{tui("share")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSave}
              >
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
            {/* Gallery (Responsive: Mobile carousel, Desktop 1+4 grid) */}
            <PackageGallery
              images={gallery}
              alt={packageName}
              onShare={handleShare}
              onFavorite={toggleSave}
              onBack={() => router.back()}
              isFavorite={isSaved}
            />

            {/* Content Mobile Header (Only visible on mobile) */}
            <div className="md:hidden space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-semibold px-3 py-1">
                    {tui("professional_photographer")}
                  </Badge>
                  {packageData.is_popular && (
                    <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 shadow-sm">
                      {tui("most_popular")}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {packageName}
                </h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.floor(aggregateRating.average)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" })}
                    className="text-sm font-bold text-primary hover:underline underline-offset-4"
                  >
                    {aggregateRating.average} ({aggregateRating.count} {tReviews("total_reviews")})
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold text-primary">
                      €{pricing.isDiscounted ? pricing.price : basePrice}
                    </div>
                    {pricing.isDiscounted && (
                      <div className="flex items-center gap-2">
                        <span className="text-xl text-muted-foreground line-through font-medium">
                          €{basePrice}
                        </span>
                        <Badge className="bg-red-500 hover:bg-red-600 text-white border-none font-bold">
                          -{Math.round(pricing.discountPercentage * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid (Mobile) */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Clock, label: "Duration", val: packageDur },
                  { icon: ImageIcon, label: tui("photos"), val: extractPhotosCount(features) },
                  { icon: MapPin, label: tui("locations"), val: packageData.locations || 1 }
                ].map((stat, i) => (
                  <div key={i} className="bg-muted/40 rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/50">
                    <stat.icon className="h-5 w-5 text-primary mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{stat.label}</span>
                    <span className="text-sm font-bold">{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Description */}
            <div className="space-y-8">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-xl text-muted-foreground leading-relaxed italic border-s-4 border-primary/20 ps-6 py-2">
                  {packageDesc}
                </p>
              </div>

              <div className="space-y-6 border-t pt-8">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <Telescope className="h-6 w-6 text-primary" />
                  {tui("what_to_expect")}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-12">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-4 group">
                      <div className="mt-1 bg-primary p-1.5 rounded-full group-hover:bg-primary/70 transition-colors">
                        <Check className="h-3.5 w-3.5 text-primary-foreground stroke-[3]" />
                      </div>
                      <span className="text-lg font-semibold text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            {/* Booking Card (Inline only on Desktop) */}
            <div className="hidden lg:block lg:sticky lg:top-44">
              <BookingCard
                packageId={packageData.slug as any}
                basePrice={basePrice}
                pricing={pricing}
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
              />
            </div>

            {/* Mobile Booking Bar removed as BookingCard is now inline */}
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
        // photo count wasn't easily mapped earlier, dropping or mapping directly:
        packagePhotos={packageData.gallery_images?.length || 15}
        isPerPerson={packageData.is_per_person}
        activeDiscount={activeDiscount}
      />

      {/* Existing Sticky Bottom Bar for Mobile (Hidden on Desktop) */}
      {/* Mobile Sticky Booking Interface */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        {/* Info Rows - Collapsible on Scroll */}
        <div className={cn(
          "transition-all duration-500 ease-in-out overflow-hidden border-b border-border/50 px-4",
          isScrolled ? "max-h-0 py-0 opacity-0 border-none" : "max-h-40 py-3 opacity-100"
        )}>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground leading-tight">{tCheckout("cancellation.title")}</p>
                <p className="text-[10px] font-medium text-muted-foreground leading-tight line-clamp-1">{tCheckout("cancellation.description")}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-foreground leading-tight">{tCheckout("security.secure_payment")}</p>
                <p className="text-[10px] font-medium text-muted-foreground leading-tight">
                  {tCheckout("payment_breakdown.pay_now", { amount: `€${Math.round(displayPrice * DEPOSIT_PERCENTAGE)}` })} {tCheckout("payment_breakdown.pay_on_day", { amount: `€${displayPrice - Math.round(displayPrice * DEPOSIT_PERCENTAGE)}` })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 flex items-center justify-between gap-4 pb-safe-offset-4">
          <div className="flex flex-col">
            {packageData.is_per_person && (
              <span className="text-[14px] capitalize font-black text-muted-foreground mb-1">
                {t("per_person")}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary">
                €{pricing.isDiscounted ? pricing.price : basePrice}
              </span>
              {pricing.isDiscounted && (
                <span className="text-sm line-through text-muted-foreground font-medium opacity-60">
                  €{basePrice}
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <PackageReviews reviews={reviews} aggregateRating={aggregateRating} />
      </div>
    </div>
  );
}
