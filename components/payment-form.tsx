"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CreditCard,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import { formatPackagePricing } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type {
  BookingFormData,
  PackageId,
  PaymentFormData,
} from "@/lib/validations";
import { packagePrices } from "@/lib/validations";

interface PaymentFormProps {
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  selectedPackage: PackageId | null;
  bookingData: BookingFormData;
  isLoading: boolean;
}

export function PaymentForm({
  form,
  onSubmit,
  selectedPackage,
  bookingData,
  isLoading,
}: PaymentFormProps) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tPackages = useTranslations("packages");
  const tui = useTranslations("ui");
  const tplaceholders = useTranslations("placeholders");
  const tpayment = useTranslations("payment");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = form.handleSubmit(onSubmit);

  if (!selectedPackage) {
    return null;
  }

  // Get pricing with tax breakdown
  const packagePricing = formatPackagePricing(selectedPackage, locale);

  const packageInfo = {
    name: tPackages(`${selectedPackage}.title`),
    price: packagePrices[selectedPackage],
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    if (!value) return "";

    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, "");

    // Limit to 19 digits maximum
    const limitedDigits = digitsOnly.slice(0, 19);

    // Add spaces every 4 digits
    const formatted = limitedDigits.replace(/(\d{4})(?=\d)/g, "$1 ");

    return formatted;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Security Badge */}
      <div className="flex items-center gap-2 text-sm bg-green-50 p-4 rounded-lg border border-green-200/60">
        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
        <span className="text-green-800 font-medium">
          {t("security.payment_secure_message")}
        </span>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="cardHolderName"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {t("form.card_holder")}
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  autoComplete="cc-name"
                  placeholder={tplaceholders("card_holder")}
                  className="uppercase h-11 sm:h-12 text-sm sm:text-base font-medium"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                {t("form.card_number")}
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  autoComplete="cc-number"
                  placeholder={tplaceholders("card_number")}
                  maxLength={19}
                  pattern="[0-9\s]*"
                  inputMode="numeric"
                  className="h-11 sm:h-12 text-sm sm:text-base font-mono tracking-wider"
                  value={formatCardNumber(field.value)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="expireMonth"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="block sm:hidden">
                    {t("form.month_short")}
                  </span>
                  <span className="hidden sm:block">
                    {t("form.expire_month")}
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    autoComplete="cc-exp-month"
                    placeholder={tplaceholders("expire_mm")}
                    maxLength={2}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="h-11 sm:h-12 text-sm sm:text-base font-mono text-center"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      field.onChange(value);
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expireYear"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="block sm:hidden">
                    {t("form.year_short")}
                  </span>
                  <span className="hidden sm:block">
                    {t("form.expire_year")}
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    autoComplete="cc-exp-year"
                    placeholder={tplaceholders("expire_yy")}
                    maxLength={2}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="h-11 sm:h-12 text-sm sm:text-base font-mono text-center"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      field.onChange(value);
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cvc"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  {t("form.cvc")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    autoComplete="cc-csc"
                    placeholder={tplaceholders("cvc_placeholder")}
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="h-11 sm:h-12 text-sm sm:text-base font-mono text-center"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      field.onChange(value);
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="flex items-start space-x-3 rtl:space-x-reverse p-4 bg-muted/50 rounded-lg border">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-relaxed cursor-pointer"
          >
            {t("form.terms")}
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={!acceptedTerms || isLoading}
            className="h-12 px-6 text-sm font-medium w-full sm:min-w-[160px] sm:w-auto"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t("buttons.processing")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {t("buttons.pay_amount", {
                  amount: packagePricing.totalPrice,
                })}
              </div>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
