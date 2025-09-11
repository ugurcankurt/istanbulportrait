"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Check, Clock, Image as ImageIcon, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BookingSuccess } from "@/components/booking-success";
import { PaymentForm } from "@/components/payment-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  trackPaymentEvent,
  trackPurchase,
  trackFacebookEvent,
} from "@/lib/analytics";
import { fbPixel } from "@/lib/facebook";
import type {
  BookingFormData,
  PackageId,
  PaymentFormData,
} from "@/lib/validations";
import { formatPackagePricing } from "@/lib/pricing";
import {
  createBookingSchema,
  createPaymentSchema,
  packagePrices,
} from "@/lib/validations";
import { getIyzicoErrorMessage } from "@/lib/iyzico-errors";
import { useIndexNow } from "@/lib/hooks/use-indexnow";

export function CheckoutForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("checkout");
  const _tPackages = useTranslations("packages");
  const tui = useTranslations("ui");
  const tValidation = useTranslations("validation");
  const tPricing = useTranslations("pricing");
  const tIyzicoErrors = useTranslations("iyzico_errors");

  const [selectedPackage, setSelectedPackage] = useState<PackageId | null>(
    null,
  );
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preFilledBookingData, setPreFilledBookingData] =
    useState<BookingFormData | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // IndexNow integration for automatic URL submission
  const { notifyBookingCreated } = useIndexNow();

  // Create schemas with translations
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

  // Initialize with package from URL params and load booking data from sessionStorage
  useEffect(() => {
    const packageParam = searchParams.get("package") as PackageId;
    if (packageParam && packageParam in packagePrices) {
      setSelectedPackage(packageParam);
    }

    // Load pre-filled booking data from sessionStorage
    const storedBookingData = sessionStorage.getItem("bookingData");
    if (storedBookingData) {
      try {
        const bookingData = JSON.parse(storedBookingData) as BookingFormData;
        setPreFilledBookingData(bookingData);

        // Pre-fill the form with stored data
        Object.keys(bookingData).forEach((key) => {
          bookingForm.setValue(
            key as keyof BookingFormData,
            bookingData[key as keyof BookingFormData],
          );
        });
      } catch (error) {
        console.error("Error loading booking data from sessionStorage:", error);
        // If no booking data, redirect back to packages
        router.push("/packages");
      }
    } else {
      // If no booking data, redirect back to packages
      router.push("/packages");
    }
  }, [searchParams, bookingForm, router]);

  const packageInfo = selectedPackage
    ? {
        name: _tPackages(`${selectedPackage}.title`),
        price: packagePrices[selectedPackage],
        duration: _tPackages(`${selectedPackage}.duration`),
        photos: _tPackages(`${selectedPackage}.photos`),
        locations: _tPackages(`${selectedPackage}.locations`),
        features: _tPackages.raw(`${selectedPackage}.features`) as string[],
      }
    : null;

  const handlePaymentSubmit = async (paymentData: PaymentFormData) => {
    if (!selectedPackage) return;

    setIsLoading(true);

    // Get booking data once at the beginning - outside try block
    const bookingData = bookingForm.getValues();

    try {
      // Step 1: Initialize payment FIRST (no booking creation yet)
      const paymentResponse = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentData,
          customerData: bookingData,
          amount: packagePrices[selectedPackage],
          packageId: selectedPackage,
          locale,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error(t("error.payment_init_failed"));
      }

      const paymentResult = await paymentResponse.json();

      if (paymentResult.status === "success") {
        // Step 2: Create booking ONLY after successful payment
        const bookingResponse = await fetch("/api/booking/create-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...bookingData,
            paymentId: paymentResult.paymentId,
            conversationId: paymentResult.conversationId,
          }),
        });

        if (!bookingResponse.ok) {
          throw new Error(t("error.booking_failed"));
        }

        const bookingResult = await bookingResponse.json();

        setBookingId(bookingResult.booking.id);
        setShowSuccess(true);
        toast.success(t("success.payment_successful"));

        // Clear booking data from sessionStorage
        sessionStorage.removeItem("bookingData");

        // Notify search engines about new booking (IndexNow)
        try {
          await notifyBookingCreated(bookingResult.booking.id);
          if (process.env.NODE_ENV === "development") {
            console.log("🔄 IndexNow notification sent for new booking");
          }
        } catch (indexNowError) {
          // Don't break the flow if IndexNow fails
          console.warn("IndexNow notification failed:", indexNowError);
        }

        // Track successful payment conversion with Enhanced Ecommerce
        trackPaymentEvent(
          selectedPackage,
          packagePrices[selectedPackage],
          "success",
        );
        trackPurchase(
          bookingResult.booking.id,
          selectedPackage,
          packagePrices[selectedPackage],
        );

        // Track Facebook Purchase
        fbPixel.trackPurchase(
          selectedPackage,
          packagePrices[selectedPackage],
          bookingResult.booking.id,
        );
        trackFacebookEvent("Purchase", {
          email: bookingData.customerEmail,
          phone: bookingData.customerPhone,
          packageId: selectedPackage,
          amount: packagePrices[selectedPackage],
          transactionId: bookingResult.booking.id,
        });
      } else {
        // Payment failed - no booking created, user can retry
        trackPaymentEvent(
          selectedPackage,
          packagePrices[selectedPackage],
          "failure",
        );

        // Handle Iyzico error with localized message
        const errorCode = paymentResult.errorCode;
        if (process.env.NODE_ENV === "development") {
          console.log(`🔍 Payment result debug:`, {
            errorCode,
            locale,
            hasErrorCode: !!errorCode,
            paymentResult,
          });
        }

        if (errorCode) {
          // Debug log for error code handling (development only)
          if (process.env.NODE_ENV === "development") {
            console.log(
              `🎯 Processing error code: ${errorCode} for locale: ${locale}`,
            );
          }
          const iyzicoError = getIyzicoErrorMessage(errorCode, locale);
          if (process.env.NODE_ENV === "development") {
            console.log(`✅ Localized error:`, iyzicoError);
          }
          throw new Error(`${iyzicoError.message}|${iyzicoError.suggestion}`);
        }

        throw new Error(
          paymentResult.errorMessage || t("error.payment_failed"),
        );
      }
    } catch (error) {
      console.error("Payment error:", error);

      // Enhanced error handling with Iyzico error codes
      let errorMessage = t("error.payment_failed");

      if (error instanceof Error) {
        // Check if it's an Iyzico error with suggestions (using | separator)
        if (error.message.includes("|")) {
          const [message, suggestion] = error.message.split("|");
          errorMessage = message;
          // Show combined message with suggestion
          toast.error(
            <div className="space-y-2">
              <div className="font-medium">{message}</div>
              <div className="text-sm text-muted-foreground">{suggestion}</div>
            </div>,
            {
              duration: 8000,
              style: {
                maxWidth: "400px",
              },
            },
          );
          return; // Exit early to avoid showing duplicate toast
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);

      // Track payment failure
      if (selectedPackage) {
        trackPaymentEvent(
          selectedPackage,
          packagePrices[selectedPackage],
          "failure",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper component for Booking Summary content
  const BookingSummaryContent = () => (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("labels.customer")}</span>
          <span className="font-medium">
            {preFilledBookingData?.customerName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("labels.date")}</span>
          <span className="font-medium">
            {preFilledBookingData?.bookingDate}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("labels.time")}</span>
          <span className="font-medium">
            {preFilledBookingData?.bookingTime}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("labels.package")}</span>
          <span className="font-medium">{packageInfo?.name}</span>
        </div>
      </div>
    </div>
  );

  // Helper component for Package Summary content with tax breakdown
  const PackageSummaryContent = ({
    tPricing: translations,
  }: {
    tPricing: any;
  }) => {
    if (!selectedPackage) return null;

    const pricing = formatPackagePricing(selectedPackage, locale);

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-primary">
                {packageInfo?.name}
              </h3>
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{packageInfo?.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="w-3 h-3" />
                  <span>{packageInfo?.photos}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{packageInfo?.locations}</span>
                </div>
              </div>
            </div>
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 border-green-200"
            >
              {tui("selected")}
            </Badge>
          </div>

          {/* Key Features */}
          <div className="space-y-2 mt-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t("included_features") || "Included Features"}
            </h4>
            <ul className="space-y-1">
              {packageInfo?.features.slice(0, 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
              {packageInfo && packageInfo.features.length > 4 && (
                <li className="text-xs text-muted-foreground ml-5">
                  +{packageInfo.features.length - 4}{" "}
                  {t("more_features") || "more features"}
                </li>
              )}
            </ul>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Price Breakdown with Tax */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="space-y-2">
            {/* Base Price */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {translations("subtotal")}
              </span>
              <span>{pricing.basePrice}</span>
            </div>

            {/* Tax Amount */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {translations("tax_rate", { rate: pricing.taxRatePercentage })}
              </span>
              <span>{pricing.taxAmount}</span>
            </div>

            <Separator className="my-2" />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">
                {translations("final_total")}
              </span>
              <span className="text-2xl font-bold text-primary">
                {pricing.totalPrice}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {translations("tax_inclusive")} • {t("payment.secure_no_fees")}
          </p>
        </div>
      </div>
    );
  };

  if (showSuccess && bookingId && selectedPackage) {
    return (
      <BookingSuccess
        bookingId={bookingId}
        packageId={selectedPackage}
        customerData={preFilledBookingData || undefined}
      />
    );
  }

  if (!preFilledBookingData || !selectedPackage) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 max-w-6xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t("loading_booking")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center p-6 sm:p-8 bg-gradient-to-r from-primary/5 via-background to-primary/5">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <span className="text-2xl text-primary-foreground">🔒</span>
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t("title")}
            </CardTitle>
            <p className="text-base sm:text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
              {t("payment_description")}
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {t("security.ssl_encrypted")}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {t("security.secure_payment")}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {t("security.pci_compliant")}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-6">
            {/* Mobile Layout: Accordion */}
            <div className="lg:hidden space-y-4">
              <Accordion
                type="multiple"
                defaultValue={["booking-summary"]}
                className="space-y-4"
              >
                {/* Booking Summary Accordion */}
                <AccordionItem value="booking-summary">
                  <Card className="border-2 border-primary/10">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-bold">
                            📋
                          </span>
                        </div>
                        <span className="text-base font-semibold">
                          {t("booking_summary")}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <BookingSummaryContent />
                    </AccordionContent>
                  </Card>
                </AccordionItem>

                {/* Package Summary Accordion */}
                <AccordionItem value="package-summary">
                  <Card className="border-2 border-primary/10">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-bold">
                            📦
                          </span>
                        </div>
                        <span className="text-base font-semibold">
                          {t("package_summary")}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <PackageSummaryContent tPricing={tPricing} />
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              </Accordion>

              {/* Payment Form - Always visible on mobile */}
              <Card className="border-2 border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">
                        💳
                      </span>
                    </div>
                    {t("payment_details")}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("payment.complete_description")}
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  <Form {...paymentForm}>
                    <PaymentForm
                      form={paymentForm}
                      onSubmit={handlePaymentSubmit}
                      selectedPackage={selectedPackage}
                      bookingData={preFilledBookingData}
                      isLoading={isLoading}
                    />
                  </Form>
                </CardContent>
              </Card>
            </div>

            {/* Desktop Layout: Original grid */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Payment Form - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Compact Booking Summary */}
                  <Card className="border-2 border-primary/10">
                    <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-bold">
                            📋
                          </span>
                        </div>
                        {t("booking_summary")}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm mt-1">
                        {t("booking.review_details")}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <BookingSummaryContent />
                    </CardContent>
                  </Card>

                  {/* Payment Form */}
                  <Card className="border-2 border-primary/10">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-bold">
                            💳
                          </span>
                        </div>
                        {t("payment_details")}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm mt-1">
                        {t("payment.complete_description")}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Form {...paymentForm}>
                        <PaymentForm
                          form={paymentForm}
                          onSubmit={handlePaymentSubmit}
                          selectedPackage={selectedPackage}
                          bookingData={preFilledBookingData}
                          isLoading={isLoading}
                        />
                      </Form>
                    </CardContent>
                  </Card>
                </div>

                {/* Package Summary Sidebar */}
                <div className="space-y-6">
                  <Card className="sticky top-20 border-2 border-primary/10">
                    <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-bold">
                            📦
                          </span>
                        </div>
                        {t("package_summary")}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm mt-1">
                        {t("package.selected_details")}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <PackageSummaryContent tPricing={tPricing} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
