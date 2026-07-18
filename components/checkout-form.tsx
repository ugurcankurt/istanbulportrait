"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useYandexMetrica } from "@/components/analytics/yandex-metrica";
import { BookingSuccess } from "@/components/booking-success";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  saveUserDataForAdvancedMatching,
    trackBeginCheckout,
  trackFacebookEvent,
  trackPaymentEvent,
  trackPurchase,
} from "@/lib/analytics";
import {
  fbPixel,
  hashCustomerData,
  hashPhoneNumber,
} from "@/lib/facebook";
import { settingsService } from "@/lib/settings-service";
import {
  formatPackagePricing,
  getPackagePricing,
  matchActiveSurcharge,
} from "@/lib/pricing";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  BookingFormData,
  PackageId,
} from "@/lib/validations";
import {
  createBookingSchema,
} from "@/lib/validations";
import Link from "next/link";
import type { TimeSurcharge } from "@/lib/availability-service";

// ─── Step 1: Booking Summary ──────────────────────────────────────────────────

function Step1Summary({
  t,
  tPricing,
  tui,
  locale,
  preFilledBookingData,
  packageInfo,
  selectedPackage,
  promoCodeInput,
  setPromoCodeInput,
  appliedPromo,
  setAppliedPromo,
  promoError,
  isLoadingPromo,
  handleApplyPromo,
  onSubmit,
  isSubmitting,
  timeSurcharges,
}: {
  t: (k: string, v?: any) => string;
  tPricing: (k: string, v?: any) => string;
  tui: (k: string) => string;
  locale: string;
  preFilledBookingData: BookingFormData;
  packageInfo: any;
  selectedPackage: PackageId;
  promoCodeInput: string;
  setPromoCodeInput: (v: string) => void;
  appliedPromo: { code: string; percentage: number } | null;
  setAppliedPromo: (v: { code: string; percentage: number } | null) => void;
  promoError: string;
  isLoadingPromo: boolean;
  handleApplyPromo: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  timeSurcharges?: TimeSurcharge[];
}) {
  const { formatPrice } = useCurrency();
  const activeSurcharge = matchActiveSurcharge(preFilledBookingData?.bookingTime, timeSurcharges);
  const surchargePercentage = activeSurcharge ? activeSurcharge.surcharge_percentage : 0;

  const rawPricing = getPackagePricing(
    selectedPackage,
    (preFilledBookingData as any)?.basePrice || preFilledBookingData?.totalAmount || 0,
    (preFilledBookingData as any)?.activeDiscount || null,
    appliedPromo,
    preFilledBookingData?.bookingDate,
    (preFilledBookingData as any)?.isPerPerson ? preFilledBookingData?.peopleCount : undefined,
    undefined,
    undefined,
    surchargePercentage
  );

  const pricing = {
    ...rawPricing,
    originalPrice: formatPrice(rawPricing.originalPrice),
    discountAmount: formatPrice(rawPricing.discountAmount),
    depositAmount: formatPrice(rawPricing.depositAmount),
    remainingAmount: formatPrice(rawPricing.remainingAmount),
    totalPrice: formatPrice(rawPricing.totalPrice),
    taxAmount: formatPrice(rawPricing.taxAmount),
    promoAmount: rawPricing.promoAmount ? formatPrice(rawPricing.promoAmount) : undefined
  };
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 pb-2 min-h-0">
        {/* Package info row */}
        <div className="rounded-2xl border-[0.5px] border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{packageInfo?.name}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 text-primary shrink-0" />{packageInfo?.duration}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ImageIcon className="w-3 h-3 text-primary shrink-0" />{packageInfo?.photos}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />{packageInfo?.locations}
                </span>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">{tui("selected")}</Badge>
          </div>
        </div>

        {/* Booking details */}
        <div className="rounded-2xl border-[0.5px] border-border/50 bg-background overflow-hidden mt-4">
          <div className="grid grid-cols-2 divide-x divide-y divide-border/50">
            {[
              { label: t("labels.customer"), value: preFilledBookingData?.customerName },
              { label: t("labels.date"), value: preFilledBookingData?.bookingDate },
              { label: t("labels.time"), value: preFilledBookingData?.bookingTime },
              { label: t("labels.package"), value: packageInfo?.name },
              ...((preFilledBookingData as any)?.isPerPerson && preFilledBookingData?.peopleCount
                ? [{ label: t("labels.people_count"), value: `${preFilledBookingData.peopleCount} ${preFilledBookingData.peopleCount === 1 ? t("person") : t("people")}` }]
                : []),
            ].map((row, i) => (
              <div key={i} className="px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{row.label}</p>
                <p className="text-xs font-semibold mt-0.5 truncate">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Promo code */}
        <div className="rounded-2xl border-[0.5px] border-border/50 bg-background overflow-hidden p-4 space-y-3 mt-4">
          <label className="text-sm font-semibold">{t("promo_code") || "Promo Code"}</label>
          <div className="flex gap-2">
            <Input 
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. SPRING20"
              disabled={!!appliedPromo}
              className="rounded-xl h-11 bg-muted/40 border-none focus:bg-background focus:ring-1 focus:ring-primary/30"
            />
            {!appliedPromo ? (
              <Button onClick={handleApplyPromo} disabled={!promoCodeInput.trim() || isLoadingPromo} className="h-11 rounded-xl">
                {isLoadingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : t("apply") || "Apply"}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setAppliedPromo(null); setPromoCodeInput(""); }}>
                Remove
              </Button>
            )}
          </div>
          {promoError && <p className="text-xs text-red-500">{promoError}</p>}
        </div>

        {/* Pricing breakdown */}
        <div className="rounded-2xl border-[0.5px] border-border/50 bg-background overflow-hidden mt-4">
          <div className="px-3 py-2 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{tPricing("subtotal")}</span>
              <span>{pricing.originalPrice}</span>
            </div>
            {pricing.isDiscounted && pricing.appliedDiscountPercentage > 0 && (
              <div className="flex justify-between text-xs text-success">
                <span>{t("seasonal_discount_applied", { percentage: (pricing.appliedDiscountPercentage * 100).toFixed(0) })}</span>
                <span>-{pricing.discountAmount}</span>
              </div>
            )}
            {pricing.promoAmount && (
              <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                <span>{t("promo_code") || "Promo Code"} ({pricing.promoCode})</span>
                <span>-{pricing.promoAmount}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold">{tPricing("final_total")}</span>
              <span className="text-lg font-bold text-primary">{pricing.totalPrice}</span>
            </div>
          </div>


          <p className="text-[10px] text-muted-foreground text-center py-1.5">
            {tPricing("tax_inclusive")} ({pricing.taxAmount} {tPricing("vat")})
          </p>
        </div>


      </div>

      {/* CTA */}
      <div className="pt-4 shrink-0">
        <Button onClick={onSubmit} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-bold text-base shadow-sm">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (t("buttons.complete_booking") || "Complete Booking")}
        </Button>
      </div>
    </div>
  );
}

// ─── Main CheckoutForm ────────────────────────────────────────────────────────

export function CheckoutForm({ timeSurcharges = [] }: { timeSurcharges?: TimeSurcharge[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("checkout");
    const tui = useTranslations("ui");
  const tValidation = useTranslations("validation");
  const tPricing = useTranslations("pricing");

    const [selectedPackage, setSelectedPackage] = useState<PackageId | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preFilledBookingData, setPreFilledBookingData] = useState<BookingFormData | null>(null);

  const activeSurcharge = matchActiveSurcharge(preFilledBookingData?.bookingTime, timeSurcharges);
  const computedSurchargePercentage = activeSurcharge ? activeSurcharge.surcharge_percentage : 0;
  const [showSuccess, setShowSuccess] = useState(false);
  // Promo code states
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percentage: number } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [isLoadingPromo, setIsLoadingPromo] = useState(false);
    const [turinvoiceOrder, setTurinvoiceOrder] = useState<{
    idOrder: number;
    paymentUrl: string;
    amountTRY: number;
    amountEUR: number;
    exchangeRate: number;
  } | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [eventId, setEventId] = useState<string>("");
  const { trackPurchase: trackYandexPurchase } = useYandexMetrica();
  const pricing = selectedPackage
    ? getPackagePricing(
      selectedPackage,
      (preFilledBookingData as any)?.basePrice || preFilledBookingData?.totalAmount || 0,
      (preFilledBookingData as any)?.activeDiscount || null,
      appliedPromo,
      preFilledBookingData?.bookingDate,
      (preFilledBookingData as any)?.isPerPerson ? preFilledBookingData?.peopleCount : undefined,
      undefined,
      undefined,
      computedSurchargePercentage
    )
    : null;


  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || !selectedPackage) return;
    
    setIsLoadingPromo(true);
    setPromoError("");
    
    try {
      const response = await fetch(`/api/booking/validate-promo?code=${encodeURIComponent(promoCodeInput.trim().toUpperCase())}&packageId=${selectedPackage}`);
      const data = await response.json();
      
      if (!response.ok) {
        setPromoError(data.error || "Invalid promo code");
        setAppliedPromo(null);
        return;
      }
      
      setAppliedPromo({
        code: data.code,
        percentage: data.discount_percentage
      });
      setPromoError("");
    } catch (error) {
      setPromoError("Failed to validate promo code");
      setAppliedPromo(null);
    } finally {
      setIsLoadingPromo(false);
    }
  };

  const bookingSchemaWithTranslations = createBookingSchema(tValidation);
  
  const bookingForm = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchemaWithTranslations),
    defaultValues: {
      packageId: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      bookingDate: "",
      bookingTime: "",
      notes: "",
      totalAmount: 0,
    },
  });

  

  useEffect(() => {
    if (!eventId) setEventId(crypto.randomUUID());

    const packageParam = searchParams.get("package") as PackageId;
    let effectivePackageId = packageParam ? packageParam : null;

    const storedBookingData =
      typeof window !== "undefined" ? sessionStorage.getItem("bookingData") : null;

    if (storedBookingData) {
      try {
        const storedData = JSON.parse(storedBookingData);
        if (storedData && typeof storedData === "object" && "bookingId" in storedData) {
          setBookingId(storedData.bookingId as string);
        }
        const bookingData = storedData as BookingFormData;
        setPreFilledBookingData(bookingData);
        Object.keys(bookingData).forEach((key) => {
          bookingForm.setValue(key as keyof BookingFormData, bookingData[key as keyof BookingFormData]);
        });
        if (!effectivePackageId && bookingData.packageId) {
          effectivePackageId = bookingData.packageId as PackageId;
        }
      } catch (error) {
        console.error("Error loading booking data from sessionStorage:", error);
      }
    }

    if (effectivePackageId) {
      setSelectedPackage(effectivePackageId);
    } else {
      router.push(`/${locale}/packages`);
    }
  }, [searchParams, bookingForm, router, eventId, locale]);

  // Auto-apply promo code from URL
  useEffect(() => {
    const coupon = searchParams.get("coupon");
    if (coupon && selectedPackage && !appliedPromo && !isLoadingPromo && !promoError && !promoCodeInput) {
      const upperCoupon = coupon.toUpperCase();
      setPromoCodeInput(upperCoupon);
      
      const autoApply = async () => {
        setIsLoadingPromo(true);
        setPromoError("");
        try {
          const response = await fetch(`/api/booking/validate-promo?code=${encodeURIComponent(upperCoupon)}&packageId=${selectedPackage}`);
          const data = await response.json();
          if (!response.ok) {
            setPromoError(data.error || "Invalid promo code from URL");
            return;
          }
          setAppliedPromo({
            code: data.code,
            percentage: data.discount_percentage
          });
        } catch (error) {
          setPromoError("Failed to validate promo code");
        } finally {
          setIsLoadingPromo(false);
        }
      };
      
      autoApply();
    }
  }, [searchParams, selectedPackage, appliedPromo]);

  const packageInfo = selectedPackage
    ? {
      name: (preFilledBookingData as any)?.packageDisplayName || selectedPackage,
      price: preFilledBookingData?.totalAmount || 0,
      duration: (preFilledBookingData as any)?.packageDuration || "",
      photos: (preFilledBookingData as any)?.packagePhotos || "",
      locations: (preFilledBookingData as any)?.packageLocations || "",
      features: ((preFilledBookingData as any)?.packageFeatures || []) as string[],
    }
    : null;

  useEffect(() => {
    if (selectedPackage && packageInfo && eventId) {
      trackBeginCheckout(selectedPackage, packageInfo.name, packageInfo.price, "EUR", eventId);
    }
  }, [selectedPackage, packageInfo, eventId]);

  const customerEmail = bookingForm.watch("customerEmail");
  const customerPhone = bookingForm.watch("customerPhone");
  const customerName = bookingForm.watch("customerName");

  useEffect(() => {
    const initFBWithAdvancedMatching = async () => {
      if (!customerEmail && !customerPhone) return;

      const [firstName, ...lastNameParts] = (customerName || "").split(" ");
      saveUserDataForAdvancedMatching({
        email: customerEmail,
        phone: customerPhone,
        firstName: firstName || undefined,
        lastName: lastNameParts.join(" ") || undefined,
      });

      const settings = await settingsService.getSettings();
      const faceBookPixelId = settings.facebook_pixel_id;

      if (faceBookPixelId && (customerEmail || customerPhone)) {
        const hashed: Record<string, string> = {};
        if (customerEmail) hashed.em = await hashCustomerData(customerEmail);
        if (customerPhone) hashed.ph = await hashPhoneNumber(customerPhone);
        if (firstName) hashed.fn = await hashCustomerData(firstName);

        const lastName = lastNameParts.join(" ");
        if (lastName) hashed.ln = await hashCustomerData(lastName);

        fbPixel.init(faceBookPixelId, hashed);
      }
    };

    initFBWithAdvancedMatching();
  }, [customerEmail, customerPhone, customerName]);

  const handleCashPaymentSubmit = async () => {
    if (!selectedPackage || !packageInfo) return;
    setIsLoading(true);
    const bookingData = bookingForm.getValues();

    const pricingCalc = getPackagePricing(
      selectedPackage,
      (preFilledBookingData as any)?.basePrice || preFilledBookingData?.totalAmount || 0,
      (preFilledBookingData as any)?.activeDiscount || null,
      appliedPromo,
      bookingData.bookingDate,
      (preFilledBookingData as any)?.isPerPerson ? (preFilledBookingData as any)?.peopleCount : undefined,
      undefined,
      undefined,
      computedSurchargePercentage
    );

    try {
      const getCookie = (name: string) => {
        if (typeof document === "undefined") return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      };
      const fbc = getCookie("_fbc");
      const fbp = getCookie("_fbp");

      const bookingResponse = await fetch("/api/booking/create-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliedPromo,
          ...bookingData,
          totalAmount: pricingCalc.totalPrice,
          paymentId: "cash_" + Date.now(),
          conversationId: "cash_" + Date.now(),
          provider: "cash",
          providerResponse: { method: "cash" },
          eventId,
          bookingId: bookingId || undefined,
          locale,
          fbc,
          fbp,
        }),
      });

      if (!bookingResponse.ok) throw new Error(t("error.booking_failed") || "Booking failed");

      const bookingResult = await bookingResponse.json();
      setBookingId(bookingResult.booking.id);
      setConfirmedBooking(bookingResult.booking);
      setShowSuccess(true);
      toast.success(t("success.payment_successful") || "Booking successful");
      sessionStorage.removeItem("bookingData");
      
      const actualTotal = bookingResult.booking.totalAmount;
      const nameParts = bookingData.customerName.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      trackPaymentEvent(selectedPackage, actualTotal, "success");
      trackPurchase(
        bookingResult.booking.id,
        selectedPackage,
        packageInfo.name,
        actualTotal,
        "EUR",
        {
          email: bookingData.customerEmail,
          phone: bookingData.customerPhone,
          firstName,
          lastName,
        },
        eventId
      );
      trackYandexPurchase(bookingResult.booking.id, selectedPackage, actualTotal);
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("booking_confirmed", {
          detail: { customerName: bookingData.customerName, bookingDate: bookingData.bookingDate, packageId: selectedPackage },
        }));
      }
    } catch (error) {
      console.error("Booking creation error:", error);
      toast.error(t("error.booking_failed") || "Booking failed");
      if (selectedPackage) trackPaymentEvent(selectedPackage, preFilledBookingData?.totalAmount || 0, "failure");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ──
  if (showSuccess && bookingId && selectedPackage) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background overflow-y-auto">
        <BookingSuccess
          bookingId={bookingId}
          packageId={selectedPackage}
          customerData={preFilledBookingData || undefined}
          confirmedBooking={confirmedBooking}
        />
      </div>
    );
  }

  // ── Not ready ──
  if (!preFilledBookingData || !selectedPackage) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm animate-pulse">{t("loading_booking")}</p>
      </div>
    );
  }

  const handleExpire = () => {
        toast.error(t("expired") || "Reservation expired. Please select a new time.");
    router.push(`/${locale}/packages`);
  };

  
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-background overflow-hidden">
      {/* ── Mini Header ── */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
        <Link href={`/${locale}/packages`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t("buttons.back") || "Back"}</span>
        </Link>

        <div className="text-sm font-bold text-foreground absolute left-1/2 -translate-x-1/2">
          {t("title")}
        </div>

        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-success" />
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{t("security.ssl_encrypted")}</span>
        </div>
      </header>

      

      

      {/* ── Step Content ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="max-w-lg mx-auto h-full flex flex-col">
          <Step1Summary
            t={t}
            tPricing={tPricing}
            tui={tui}
            locale={locale}
            preFilledBookingData={preFilledBookingData}
            packageInfo={packageInfo}
            selectedPackage={selectedPackage}
            promoCodeInput={promoCodeInput}
            setPromoCodeInput={setPromoCodeInput}
            appliedPromo={appliedPromo}
            setAppliedPromo={setAppliedPromo}
            promoError={promoError}
            isLoadingPromo={isLoadingPromo}
            handleApplyPromo={handleApplyPromo}
            onSubmit={handleCashPaymentSubmit}
            isSubmitting={isLoading}
            timeSurcharges={timeSurcharges}
          />
        </div>
      </main>
    </div>
  );
}