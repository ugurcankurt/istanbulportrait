"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UseFormReturn } from "react-hook-form";
import { CreditCard, Lock, ShieldCheck, Calendar, Mail, User, Clock } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { packagePrices } from "@/lib/validations";
import type { PaymentFormData, BookingFormData, PackageId } from "@/lib/validations";

interface PaymentFormProps {
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  selectedPackage: PackageId | null;
  bookingData: BookingFormData;
  isLoading: boolean;
  onBack: () => void;
}

export function PaymentForm({
  form,
  onSubmit,
  selectedPackage,
  bookingData,
  isLoading,
  onBack,
}: PaymentFormProps) {
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

  const packageInfo = {
    name: tPackages(`${selectedPackage}.title`),
    price: packagePrices[selectedPackage],
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Payment Form */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <div className="p-2 bg-muted rounded-lg">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                {t("payment_details")}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                SSL
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border">
              <ShieldCheck className="w-4 h-4" />
              {tpayment("secure_powered")}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                control={form.control}
                name="cardHolderName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {t("form.card_holder")}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={tplaceholders("card_holder")} 
                        className="uppercase h-10 sm:h-11 text-sm sm:text-base font-medium"
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
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      {t("form.card_number")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tplaceholders("card_number")}
                        maxLength={19}
                        className="h-10 sm:h-11 text-sm sm:text-base font-mono tracking-wider"
                        value={formatCardNumber(field.value)}
                        onChange={(e) => field.onChange(e.target.value.replace(/\s/g, ""))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="expireMonth"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="block sm:hidden">MM</span>
                        <span className="hidden sm:block">{t("form.expire_month")}</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tplaceholders("expire_mm")}
                          maxLength={2}
                          className="h-10 sm:h-11 text-sm sm:text-base font-mono text-center"
                          {...field}
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium">
                        <span className="block sm:hidden">YY</span>
                        <span className="hidden sm:block">{t("form.expire_year")}</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tplaceholders("expire_yy")}
                          maxLength={2}
                          className="h-10 sm:h-11 text-sm sm:text-base font-mono text-center"
                          {...field}
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
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium flex items-center gap-2">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        {t("form.cvc")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={tplaceholders("cvc_placeholder")}
                          maxLength={4}
                          type="password"
                          className="h-10 sm:h-11 text-sm sm:text-base font-mono text-center"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {tpayment("security_description")}
                </AlertDescription>
              </Alert>

              <Separator />

              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg border">
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

              <div className="flex flex-col sm:flex-row justify-between pt-6 gap-3 sm:gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack} 
                  disabled={isLoading}
                  className="h-11 px-6 text-sm font-medium w-full sm:w-auto"
                >
                  {t("buttons.back")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={!acceptedTerms || isLoading}
                  className="h-11 px-6 text-sm font-medium w-full sm:min-w-[160px] sm:w-auto"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {t("buttons.processing")}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      {t("buttons.complete_booking")}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-6"
      >
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 bg-muted rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
              {tpayment("order_summary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                <div>
                  <span className="font-medium text-sm sm:text-base">{packageInfo.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Premium
                  </Badge>
                </div>
                <span className="text-lg font-semibold">€{packageInfo.price}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
              <span className="text-lg font-semibold">{tui("total")}:</span>
              <span className="text-xl font-bold">€{packageInfo.price}</span>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium">{tpayment("includes_fees")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 bg-muted rounded-lg">
                <User className="w-4 h-4" />
              </div>
              {tpayment("booking_summary")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  {tpayment("name_label")}
                </div>
                <span className="font-medium text-xs sm:text-sm">{bookingData.customerName}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {tpayment("email_label")}
                </div>
                <span className="font-medium text-xs break-all">{bookingData.customerEmail}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {tpayment("date_label")}
                </div>
                <span className="font-medium text-xs sm:text-sm">{bookingData.bookingDate}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {tpayment("time_label")}
                </div>
                <span className="font-medium text-xs sm:text-sm">{bookingData.bookingTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-muted shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-lg">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base">{tpayment("secure_payment")}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              {tpayment("iyzico_description")}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}