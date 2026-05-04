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
import { PaymentForm } from "@/components/payment-form";
import { TurinvoicePayment } from "@/components/turinvoice-payment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  saveUserDataForAdvancedMatching,
  trackAddPaymentInfo,
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
import { getIyzicoErrorMessage } from "@/lib/iyzico-errors";
import {
  formatPackagePricing,
  getPackagePricing,
  matchActiveSurcharge,
} from "@/lib/pricing";
import { cn, formatCurrency } from "@/lib/utils";
import type {
  BookingFormData,
  PackageId,
  PaymentFormData,
} from "@/lib/validations";
import {
  createBookingSchema,
  createPaymentSchema,
} from "@/lib/validations";
import Link from "next/link";
import type { TimeSurcharge } from "@/lib/availability-service";

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  currentStep,
  labels,
}: {
  currentStep: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center justify-center gap-0">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < currentStep;
        const active = n === currentStep;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2",
                  done
                    ? "bg-primary border-primary text-primary-foreground"
                    : active
                      ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md shadow-primary/30"
                      : "bg-background border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium hidden sm:block max-w-[70px] text-center leading-tight",
                  active ? "text-primary" : "text-muted-foreground/60"
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className="w-12 sm:w-16 h-0.5 mx-1 mb-3 sm:mb-4 bg-border relative overflow-hidden">
                <div
                  className="absolute inset-0 bg-primary transition-all duration-500"
                  style={{ width: done ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  onNext,
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
  onNext: () => void;
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
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
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
        <div className="rounded-xl border bg-muted/20 overflow-hidden">
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
        <div className="rounded-xl border bg-background overflow-hidden p-4 space-y-3">
          <label className="text-sm font-semibold">{t("promo_code") || "Promo Code"}</label>
          <div className="flex gap-2">
            <Input 
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. SPRING20"
              disabled={!!appliedPromo}
            />
            {!appliedPromo ? (
              <Button onClick={handleApplyPromo} disabled={!promoCodeInput.trim() || isLoadingPromo}>
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
        <div className="rounded-xl border bg-background overflow-hidden">
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

          {/* Deposit highlight */}
          <div className="bg-primary/8 border-t border-primary/20 px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-primary">{t("labels.deposit_amount")} (30%)</p>
              <p className="text-[10px] text-muted-foreground">{t("labels.remaining_cash")} (70%): {pricing.remainingAmount}</p>
            </div>
            <span className="text-base font-bold text-primary">{pricing.depositAmount}</span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center py-1.5">
            {tPricing("tax_inclusive")} ({pricing.taxAmount} {tPricing("vat")})
          </p>
        </div>

        {/* Global Payment Terms Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 flex gap-2 items-start mt-2">
           <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
           <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
             {t("labels.payment_terms_notice")}
           </p>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-3 shrink-0">
        <Button onClick={onNext} className="w-full h-12 rounded-xl font-semibold">
          {t("payment_method") || "Choose Payment"}
          <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Payment Method ───────────────────────────────────────────────────

function Step2Method({
  t,
  paymentMethod,
  setPaymentMethod,
  onBack,
  onNext,
}: {
  t: (k: string) => string;
  paymentMethod: "iyzico" | "turinvoice";
  setPaymentMethod: (v: "iyzico" | "turinvoice") => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-3 min-h-0">
        {/* Iyzico */}
        <button
          type="button"
          onClick={() => setPaymentMethod("iyzico")}
          className={cn(
            "w-full rounded-xl border-2 p-4 text-start transition-all duration-200 flex items-center gap-4",
            paymentMethod === "iyzico"
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/30"
          )}
        >
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center border-2 shrink-0 transition-all",
            paymentMethod === "iyzico" ? "border-primary bg-primary/10" : "border-border bg-background"
          )}>
            <CreditCard className={cn("w-5 h-5", paymentMethod === "iyzico" ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{t("payment_methods.credit_card")}</p>
              {paymentMethod === "iyzico" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <img src="/pay_with_iyzico_colored.svg" alt="Iyzico" className="h-4 w-auto object-contain" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-success" /> Visa · Mastercard · 3D Secure
            </p>
          </div>
        </button>

        {/* Turinvoice */}
        <button
          type="button"
          onClick={() => setPaymentMethod("turinvoice")}
          className={cn(
            "w-full rounded-xl border-2 p-4 text-start transition-all duration-200 flex items-center gap-4",
            paymentMethod === "turinvoice"
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/30"
          )}
        >
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center border-2 shrink-0 overflow-hidden transition-all",
            paymentMethod === "turinvoice" ? "border-primary bg-primary/10" : "border-border bg-background"
          )}>
            <img src="/turinvoice_logo.webp" alt="Turinvoice" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{t("payment_methods.russian_banks")}</p>
              {paymentMethod === "turinvoice" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <img src="/turinvoice_logo.webp" alt="Turinvoice" className="h-4 w-auto object-contain mt-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-success" /> MIR · SBP · Russian Banks
            </p>
          </div>
        </button>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: "🔒", label: "SSL 256-bit" },
            { icon: "🛡️", label: "3D Secure" },
            { icon: "✓", label: "PCI DSS" },
          ].map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-muted/30 border border-border/50">
              <span className="text-base">{b.icon}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-3 flex gap-3 shrink-0">
        <Button type="button" variant="outline" onClick={onBack} className="h-12 rounded-xl px-4">
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </Button>
        <Button onClick={onNext} className="flex-1 h-12 rounded-xl font-semibold">
          {t("payment_details") || "Continue"}
          <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Payment Detail (compact price strip) ─────────────────────────────

function PriceStrip({
  t,
  tPricing,
  locale,
  selectedPackage,
  preFilledBookingData,
  appliedPromo,
  computedSurchargePercentage,
}: {
  t: (k: string, v?: any) => string;
  tPricing: (k: string) => string;
  locale: string;
  selectedPackage: PackageId;
  preFilledBookingData: BookingFormData;
  appliedPromo: { code: string; percentage: number } | null;
  computedSurchargePercentage: number;
}) {
  const { formatPrice } = useCurrency();
  const rawPricing = getPackagePricing(
    selectedPackage,
    (preFilledBookingData as any)?.basePrice || preFilledBookingData?.totalAmount || 0,
    (preFilledBookingData as any)?.activeDiscount || null,
    appliedPromo,
    preFilledBookingData?.bookingDate,
    (preFilledBookingData as any)?.isPerPerson ? preFilledBookingData?.peopleCount : undefined,
    undefined,
    undefined,
    computedSurchargePercentage
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
    <div className="bg-primary/8 border border-primary/20 rounded-xl px-3 py-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-primary uppercase tracking-wide">{t("labels.deposit_amount")} (30%)</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t("labels.remaining_cash")} (70%): {pricing.remainingAmount}</p>
          {/* Seasonal discount — only show when percentage is actually > 0 */}
          {pricing.isDiscounted && pricing.appliedDiscountPercentage > 0 && (
            <p className="text-[10px] text-success mt-1">
              {(pricing.appliedDiscountPercentage * 100).toFixed(0)}% {t("seasonal_discount_applied", { percentage: (pricing.appliedDiscountPercentage * 100).toFixed(0) })}
            </p>
          )}
          {pricing.promoAmount && (
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
              {t("promo_code") || "Promo Code"} ({pricing.promoCode}): -{pricing.promoAmount}
            </p>
          )}
        </div>
        <div className="text-end">
          <p className="text-xl font-bold text-primary">{pricing.depositAmount}</p>
          <p className="text-[10px] text-muted-foreground">{tPricing("final_total")}: {pricing.totalPrice}</p>
        </div>
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

  const [currentStep, setCurrentStep] = useState(1);
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
  const [paymentMethod, setPaymentMethod] = useState<"iyzico" | "turinvoice">("iyzico");
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
  const paymentSchemaWithTranslations = createPaymentSchema(tValidation);

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

  const paymentForm = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchemaWithTranslations),
    defaultValues: {
      cardHolderName: "",
      cardNumber: "",
      expireMonth: "",
      expireYear: "",
      cvc: "",
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

  const handlePaymentSubmit = async (paymentData: PaymentFormData) => {
    if (!selectedPackage || !packageInfo) return;
    setIsLoading(true);
    const bookingData = bookingForm.getValues();

    trackAddPaymentInfo(selectedPackage, packageInfo.name, packageInfo.price, "credit_card", "EUR", eventId);

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

      const paymentResponse = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliedPromo,
          paymentData, 
          customerData: {
            ...bookingData,
            activeDiscount: (preFilledBookingData as any)?.activeDiscount,
            isPerPerson: (preFilledBookingData as any)?.isPerPerson
          },
          amount: pricingCalc.depositAmount,
          packageId: selectedPackage, locale, eventId,
        }),
      });

      if (!paymentResponse.ok) throw new Error(t("error.payment_init_failed"));

      const paymentResult = await paymentResponse.json();

      if (paymentResult.status === "success") {
        const bookingResponse = await fetch("/api/booking/create-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appliedPromo,
            activeDiscount: (preFilledBookingData as any)?.activeDiscount,
            isPerPerson: (preFilledBookingData as any)?.isPerPerson,
            ...bookingData,
            totalAmount: pricingCalc.totalPrice,
            paymentId: paymentResult.paymentId,
            conversationId: paymentResult.conversationId,
            providerResponse: paymentResult.providerResponse,
            eventId, bookingId: bookingId || undefined, locale,
            fbc, fbp,
          }),
        });

        if (!bookingResponse.ok) throw new Error(t("error.booking_failed"));

        const bookingResult = await bookingResponse.json();
        setBookingId(bookingResult.booking.id);
        setConfirmedBooking(bookingResult.booking);
        setShowSuccess(true);
        toast.success(t("success.payment_successful"));
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
      } else {
        trackPaymentEvent(selectedPackage, preFilledBookingData?.totalAmount || 0, "failure");
        const errorCode = paymentResult.errorCode;
        if (errorCode) {
          const iyzicoError = getIyzicoErrorMessage(errorCode, locale);
          throw new Error(`${iyzicoError.message}|${iyzicoError.suggestion}`);
        }
        throw new Error(paymentResult.errorMessage || t("error.payment_failed"));
      }
    } catch (error) {
      console.error("Payment error:", error);
      let errorMessage = t("error.payment_failed");
      if (error instanceof Error) {
        if (error.message.includes("|")) {
          const [message, suggestion] = error.message.split("|");
          toast.error(
            <div className="space-y-1">
              <div className="font-medium">{message}</div>
              <div className="text-sm text-muted-foreground">{suggestion}</div>
            </div>,
            { duration: 8000, style: { maxWidth: "400px" } },
          );
          return;
        }
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      if (selectedPackage) trackPaymentEvent(selectedPackage, preFilledBookingData?.totalAmount || 0, "failure");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurinvoiceInitialize = async () => {
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

      const response = await fetch("/api/payment/initialize/turinvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliedPromo,
          customerData: {
            ...bookingData,
            activeDiscount: (preFilledBookingData as any)?.activeDiscount,
            isPerPerson: (preFilledBookingData as any)?.isPerPerson
          },
          amount: pricingCalc.depositAmount,
          packageId: selectedPackage, locale, eventId,
          fbc, fbp,
        }),
      });

      if (!response.ok) throw new Error(t("error.payment_init_failed"));

      const data = await response.json();
      if (data.success) {
        setTurinvoiceOrder({
          idOrder: data.idOrder, paymentUrl: data.paymentUrl,
          amountTRY: data.amountTRY, amountEUR: data.amountEUR,
          exchangeRate: data.exchangeRate,
        });
      } else {
        throw new Error(data.error || t("error.payment_init_failed"));
      }
    } catch (error) {
      console.error("Turinvoice init error:", error);
      toast.error(t("error.payment_init_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurinvoiceSuccess = async () => {
    if (!turinvoiceOrder || !selectedPackage || !packageInfo) return;
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
          ...bookingData, totalAmount: pricingCalc.totalPrice,
          paymentId: turinvoiceOrder.idOrder.toString(),
          conversationId: `turinvoice_${turinvoiceOrder.idOrder}`,
          provider: "turinvoice", eventId, bookingId: bookingId || undefined,
          locale, fbc, fbp,
        }),
      });

      if (!bookingResponse.ok) throw new Error(t("error.booking_failed"));

      const bookingResult = await bookingResponse.json();
      setBookingId(bookingResult.booking.id);
      setConfirmedBooking(bookingResult.booking);
      setShowSuccess(true);
      toast.success(t("success.payment_successful"));
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
    } catch (error) {
      console.error("Booking creation error:", error);
      toast.error(t("error.booking_failed"));
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

  const stepLabels = [
    t("booking_summary"),
    t("payment_method"),
    t("payment_details"),
  ];

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

      

      {/* ── Step Indicator ── */}
      <div className="shrink-0 px-4 py-3 border-b bg-muted/20">
        <StepIndicator currentStep={currentStep} labels={stepLabels} />
      </div>

      {/* ── Step Content ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <div className="max-w-lg mx-auto h-full flex flex-col">

          {/* Step 1 */}
          {currentStep === 1 && (
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
              onNext={() => setCurrentStep(2)}
              timeSurcharges={timeSurcharges}
            />
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <Step2Method
              t={t}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onBack={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
            />
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="flex flex-col h-full space-y-3">
              {/* Price strip */}
              {pricing && (
                <PriceStrip
                  t={t}
                  tPricing={tPricing}
                  locale={locale}
                  selectedPackage={selectedPackage}
                  preFilledBookingData={preFilledBookingData}
                  appliedPromo={appliedPromo}
                  computedSurchargePercentage={computedSurchargePercentage}
                />
              )}

              {/* Payment form / Turinvoice */}
              <div className="flex-1 min-h-0">
                {paymentMethod === "iyzico" ? (
                  <Form {...paymentForm}>
                    <PaymentForm
                      form={paymentForm}
                      onSubmit={handlePaymentSubmit}
                      selectedPackage={selectedPackage}
                      bookingData={preFilledBookingData}
                      isLoading={isLoading}
                      appliedPromo={appliedPromo}
                      computedSurchargePercentage={computedSurchargePercentage}
                    />
                  </Form>
                ) : paymentMethod === "turinvoice" ? (
                  <div className="space-y-4">
                    {!turinvoiceOrder ? (
                      <div className="text-center space-y-4 py-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center border">
                          <img src="/turinvoice_logo.webp" alt="Turinvoice" className="w-12 h-12 object-contain" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t("turinvoice_description")}</p>
                        <Button
                          size="lg"
                          className="w-full rounded-xl h-12"
                          onClick={handleTurinvoiceInitialize}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("buttons.processing")}</>
                          ) : (
                            t("buttons.pay_amount", { amount: pricing ? formatCurrency(pricing.depositAmount, locale) : "" })
                          )}
                        </Button>
                      </div>
                    ) : (
                      <TurinvoicePayment
                        idOrder={turinvoiceOrder.idOrder}
                        paymentUrl={turinvoiceOrder.paymentUrl}
                        amountTRY={turinvoiceOrder.amountTRY}
                        amountEUR={turinvoiceOrder.amountEUR}
                        exchangeRate={turinvoiceOrder.exchangeRate}
                        onSuccess={handleTurinvoiceSuccess}
                        onTimeout={() => setTurinvoiceOrder(null)}
                      />
                    )}
                  </div>
                ) : null}
              </div>

              {/* Back link */}
              {!turinvoiceOrder && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  {t("buttons.back") || "Back to payment method"}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}