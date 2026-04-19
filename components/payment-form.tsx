"use client";

import {
  CreditCard,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPackagePricing } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type {
  BookingFormData,
  PackageId,
  PaymentFormData,
} from "@/lib/validations";

// ─── Card Type Detection ───────────────────────────────────────────────────────

export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "unionpay"
  | "mir"
  | "troy"
  | "unknown";

export function detectCardBrand(cardNumber: string): CardBrand {
  const num = cardNumber.replace(/\s/g, "");
  if (!num) return "unknown";

  // MIR (Russian) — 2200–2204
  if (/^220[0-4]/.test(num)) return "mir";

  // American Express — 34, 37
  if (/^3[47]/.test(num)) return "amex";

  // Visa — starts with 4
  if (/^4/.test(num)) return "visa";

  // Mastercard — 51–55 or 2221–2720
  if (/^5[1-5]/.test(num)) return "mastercard";
  if (/^2(2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(num)) return "mastercard";

  // Discover — 6011, 622126–622925, 644–649, 65
  if (/^(6011|65|64[4-9]|622(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5])))/.test(num)) return "discover";

  // UnionPay — 62 (broad range, after Discover's 622 subset)
  if (/^62/.test(num)) return "unionpay";

  // Troy (Turkish card) — 9792
  if (/^9792/.test(num)) return "troy";

  return "unknown";
}

// ─── Card Brand SVG Icons ─────────────────────────────────────────────────────

function VisaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="15" fill="#1A1F71" letterSpacing="-0.5">VISA</text>
    </svg>
  );
}

function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="14" cy="12" r="10" fill="#EB001B" />
      <circle cx="24" cy="12" r="10" fill="#F79E1B" />
      <path d="M19 5.27A10 10 0 0 1 22.73 12 10 10 0 0 1 19 18.73 10 10 0 0 1 15.27 12 10 10 0 0 1 19 5.27z" fill="#FF5F00" />
    </svg>
  );
}

function AmexIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="16" rx="2" fill="#2E77BC" />
      <text x="4" y="12" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="9" fill="white" letterSpacing="0.5">AMEX</text>
    </svg>
  );
}

function DiscoverIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <text x="0" y="12" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" fill="#231F20" letterSpacing="0.2">DISCOVER</text>
      <circle cx="52" cy="8" r="7" fill="#F76F20" />
    </svg>
  );
}

function UnionPayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="52" height="16" rx="2" fill="#E21836" />
      <text x="4" y="12" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8" fill="white">UnionPay</text>
    </svg>
  );
}

function MirIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="16" rx="2" fill="#00A0E3" />
      <text x="6" y="12" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="11" fill="white">МИР</text>
    </svg>
  );
}

function TroyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="48" height="16" rx="2" fill="#E30A17" />
      <text x="6" y="12" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="11" fill="white">TROY</text>
    </svg>
  );
}

// ─── Card Brand Badge ─────────────────────────────────────────────────────────

interface CardBrandBadgeProps {
  brand: CardBrand;
  digits: string; // raw digits for display
}

function CardBrandBadge({ brand, digits }: CardBrandBadgeProps) {
  if (brand === "unknown" && digits.length === 0) {
    // Show all possible cards faded when no input
    return (
      <div className="flex items-center gap-1">
        <MastercardIcon className="h-5 w-auto opacity-30" />
        <VisaIcon className="h-4 w-auto opacity-30" />
      </div>
    );
  }

  if (brand === "unknown") {
    return (
      <div className="flex items-center gap-1">
        <MastercardIcon className="h-5 w-auto opacity-20" />
        <VisaIcon className="h-4 w-auto opacity-20" />
      </div>
    );
  }

  const iconMap: Record<CardBrand, React.ReactNode> = {
    visa: <VisaIcon className="h-5 w-auto" />,
    mastercard: <MastercardIcon className="h-6 w-auto" />,
    amex: <AmexIcon className="h-5 w-auto" />,
    discover: <DiscoverIcon className="h-4 w-auto" />,
    unionpay: <UnionPayIcon className="h-5 w-auto" />,
    mir: <MirIcon className="h-5 w-auto" />,
    troy: <TroyIcon className="h-5 w-auto" />,
    unknown: null,
  };

  return (
    <div className="flex items-center animate-in fade-in zoom-in-95 duration-200">
      {iconMap[brand]}
    </div>
  );
}

// ─── PaymentForm ──────────────────────────────────────────────────────────────

interface PaymentFormProps {
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  selectedPackage: PackageId | null;
  bookingData: BookingFormData;
  isLoading: boolean;
  appliedPromo?: { code: string; percentage: number } | null;
}

export function PaymentForm({
  form,
  onSubmit,
  selectedPackage,
  bookingData,
  isLoading,
  appliedPromo,
}: PaymentFormProps) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tplaceholders = useTranslations("placeholders");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [cardBrand, setCardBrand] = useState<CardBrand>("unknown");

  const handleSubmit = form.handleSubmit(onSubmit);

  if (!selectedPackage) return null;

  const packagePricing = formatPackagePricing(
    selectedPackage,
    (bookingData as any)?.basePrice || bookingData?.totalAmount || 0,
    (bookingData as any)?.activeDiscount || null,
    appliedPromo,
    bookingData.bookingDate,
    locale,
    (bookingData as any)?.isPerPerson ? bookingData.peopleCount : undefined
  );

  const formatCardNumber = (value: string) => {
    if (!value) return "";
    // Amex uses 4-6-5 format
    const digits = value.replace(/\D/g, "");
    if (cardBrand === "amex") {
      return digits.slice(0, 15).replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
        [a, b, c].filter(Boolean).join(" ")
      );
    }
    return digits.slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // Max length varies by card type
  const cardMaxLength = cardBrand === "amex" ? 17 : 19; // with spaces

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) =>
    (currentYear + i).toString().slice(-2)
  );

  const cvcMaxLength = cardBrand === "amex" ? 4 : 3;
  const cvcPlaceholder = cardBrand === "amex" ? "4 digits" : tplaceholders("cvc_placeholder");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Security note */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/30 border border-border/50">
        <ShieldCheck className="w-4 h-4 text-success shrink-0" />
        <p className="text-xs text-muted-foreground">{t("security.payment_secure_message")}</p>
      </div>

      {/* Card holder */}
      <FormField
        control={form.control}
        name="cardHolderName"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <User className="w-3 h-3" />
              {t("form.card_holder")}
            </FormLabel>
            <FormControl>
              <Input
                id="cardHolderName"
                type="text"
                autoComplete="cc-name"
                placeholder={tplaceholders("card_holder")}
                className="h-11 rounded-xl uppercase tracking-wide text-sm"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )}
      />

      {/* Card number with live brand detection */}
      <FormField
        control={form.control}
        name="cardNumber"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
              <CreditCard className="w-3 h-3" />
              {t("form.card_number")}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  id="cardNumber"
                  type="tel"
                  autoComplete="cc-number"
                  placeholder={tplaceholders("card_number")}
                  maxLength={cardMaxLength}
                  inputMode="numeric"
                  className={cn(
                    "h-11 rounded-xl font-mono tracking-widest text-sm pe-20 transition-all duration-200",
                    // Subtle brand color ring when detected
                    cardBrand === "visa" && "focus:ring-[#1A1F71]/30",
                    cardBrand === "mastercard" && "focus:ring-[#EB001B]/20",
                    cardBrand === "amex" && "focus:ring-[#2E77BC]/30",
                    cardBrand === "mir" && "focus:ring-[#00A0E3]/30",
                  )}
                  value={formatCardNumber(field.value)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    field.onChange(raw);
                    setCardBrand(detectCardBrand(raw));
                  }}
                />
                {/* Brand badge — right side of input */}
                <div className="absolute end-3 top-1/2 -translate-y-1/2">
                  <CardBrandBadge brand={cardBrand} digits={field.value} />
                </div>
              </div>
            </FormControl>

            {/* Brand name label below — appears when detected */}
            {cardBrand !== "unknown" && (
              <p className={cn(
                "text-[10px] font-medium animate-in fade-in slide-in-from-top-1 duration-200",
                cardBrand === "visa" && "text-[#1A1F71]",
                cardBrand === "mastercard" && "text-[#EB001B]",
                cardBrand === "amex" && "text-[#2E77BC]",
                cardBrand === "mir" && "text-[#00A0E3]",
                cardBrand === "discover" && "text-[#F76F20]",
                cardBrand === "unionpay" && "text-[#E21836]",
                cardBrand === "troy" && "text-[#E30A17]",
              )}>
                {cardBrand === "visa" && "Visa"}
                {cardBrand === "mastercard" && "Mastercard"}
                {cardBrand === "amex" && "American Express — 4 digit CVC"}
                {cardBrand === "mir" && "МИР (MIR)"}
                {cardBrand === "discover" && "Discover"}
                {cardBrand === "unionpay" && "UnionPay"}
                {cardBrand === "troy" && "Troy"}
              </p>
            )}

            <FormMessage className="text-[10px]" />
          </FormItem>
        )}
      />

      {/* Expiry + CVC */}
      <div className="grid grid-cols-3 gap-2">
        <FormField
          control={form.control}
          name="expireMonth"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium text-muted-foreground">
                <span className="sm:hidden">{t("form.month_short")}</span>
                <span className="hidden sm:inline">{t("form.expire_month")}</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <select
                    id="expireMonth"
                    autoComplete="cc-exp-month"
                    className={cn(
                      "flex h-11 w-full appearance-none rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                      !field.value && "text-muted-foreground"
                    )}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="" disabled hidden>{tplaceholders("expire_mm")}</option>
                    {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((m) => (
                      <option key={m} value={m} className="text-foreground">{m}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expireYear"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium text-muted-foreground">
                <span className="sm:hidden">{t("form.year_short")}</span>
                <span className="hidden sm:inline">{t("form.expire_year")}</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <select
                    id="expireYear"
                    autoComplete="cc-exp-year"
                    className={cn(
                      "flex h-11 w-full appearance-none rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                      !field.value && "text-muted-foreground"
                    )}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="" disabled hidden>{tplaceholders("expire_yy")}</option>
                    {years.map((y) => (
                      <option key={y} value={y} className="text-foreground">{y}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cvc"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-medium text-muted-foreground">
                {t("form.cvc")}
                {cardBrand === "amex" && (
                  <span className="ms-1 text-[9px] text-[#2E77BC]">(4 digits)</span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  id="cvc"
                  type="tel"
                  autoComplete="cc-csc"
                  placeholder={cvcPlaceholder}
                  maxLength={cvcMaxLength}
                  inputMode="numeric"
                  className="h-11 rounded-xl font-mono text-center tracking-widest text-sm"
                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                  value={field.value}
                />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/40">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(v) => setAcceptedTerms(v === true)}
          className="mt-0.5 shrink-0"
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
          {t("form.terms")}
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={!acceptedTerms || isLoading}
        className="w-full h-12 rounded-xl font-semibold text-sm"
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            {t("buttons.processing")}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {t("buttons.pay_amount", { amount: packagePricing.depositAmount })}
          </span>
        )}
      </Button>
    </form>
  );
}