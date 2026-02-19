"use client";

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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
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
  const packagePricing = formatPackagePricing(
    selectedPackage,
    locale,
    undefined,
    bookingData.bookingDate,
    selectedPackage === "rooftop" ? bookingData.peopleCount : undefined
  );

  const packageInfo = {
    name: tPackages(`${selectedPackage}.title`),
    price: bookingData.totalAmount || packagePrices[selectedPackage],
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
    <div className="animate-fade-in-up">
      {/* Payment Form */}
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldDescription className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success" />
              {t("security.payment_secure_message")}
            </FieldDescription>
            <FieldGroup>
              <FormField
                control={form.control}
                name="cardHolderName"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="cardHolderName">
                      <User className="w-4 h-4" />
                      {t("form.card_holder")}
                    </FieldLabel>
                    <Input
                      id="cardHolderName"
                      type="text"
                      autoComplete="cc-name"
                      placeholder={tplaceholders("card_holder")}
                      className="uppercase h-11 sm:h-12"
                      {...field}
                    />
                  </Field>
                )}
              />

              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="cardNumber">
                      <CreditCard className="w-4 h-4" />
                      {t("form.card_number")}
                    </FieldLabel>
                    <Input
                      id="cardNumber"
                      type="tel"
                      autoComplete="cc-number"
                      placeholder={tplaceholders("card_number")}
                      maxLength={19}
                      pattern="[0-9\s]*"
                      inputMode="numeric"
                      className="h-11 sm:h-12 font-mono tracking-wider"
                      value={formatCardNumber(field.value)}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        field.onChange(value);
                      }}
                    />
                  </Field>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="expireMonth"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>
                        <span className="block sm:hidden">
                          {t("form.month_short")}
                        </span>
                        <span className="hidden sm:block">
                          {t("form.expire_month")}
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue
                            placeholder={tplaceholders("expire_mm")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="01">01</SelectItem>
                          <SelectItem value="02">02</SelectItem>
                          <SelectItem value="03">03</SelectItem>
                          <SelectItem value="04">04</SelectItem>
                          <SelectItem value="05">05</SelectItem>
                          <SelectItem value="06">06</SelectItem>
                          <SelectItem value="07">07</SelectItem>
                          <SelectItem value="08">08</SelectItem>
                          <SelectItem value="09">09</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="11">11</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expireYear"
                  render={({ field }) => {
                    // Generate years from current year to +10 years
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: 11 }, (_, i) => {
                      const year = currentYear + i;
                      return year.toString().slice(-2); // Get last 2 digits
                    });

                    return (
                      <Field>
                        <FieldLabel>
                          <span className="block sm:hidden">
                            {t("form.year_short")}
                          </span>
                          <span className="hidden sm:block">
                            {t("form.expire_year")}
                          </span>
                        </FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue
                              placeholder={tplaceholders("expire_yy")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    );
                  }}
                />

                <FormField
                  control={form.control}
                  name="cvc"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="cvc">{t("form.cvc")}</FieldLabel>
                      <Input
                        id="cvc"
                        type="tel"
                        autoComplete="cc-csc"
                        placeholder={tplaceholders("cvc_placeholder")}
                        maxLength={4}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="h-9 font-mono text-center"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          field.onChange(value);
                        }}
                        value={field.value}
                      />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) =>
                    setAcceptedTerms(checked === true)
                  }
                />
                <FieldLabel htmlFor="terms" className="font-normal">
                  {t("form.terms")}
                </FieldLabel>
              </Field>
            </FieldGroup>
          </FieldSet>

          <Field orientation="horizontal">
            <Button
              type="submit"
              disabled={!acceptedTerms || isLoading}
              className="h-12 px-6 w-full sm:min-w-[160px] sm:w-auto"
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
                    amount: packagePricing.depositAmount,
                  })}
                </div>
              )}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
