"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  Clock,
  Image as ImageIcon,
  Loader2,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BookingSuccess } from "@/components/booking-success";
import { PaymentForm } from "@/components/payment-form";
import { TurinvoicePayment } from "@/components/turinvoice-payment";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  trackAddPaymentInfo,
  trackBeginCheckout,
  trackFacebookEvent,
  trackPaymentEvent,
  trackPurchase,
} from "@/lib/analytics";
import { fbPixel } from "@/lib/facebook";
import { useIndexNow } from "@/lib/hooks/use-indexnow";
import { getIyzicoErrorMessage } from "@/lib/iyzico-errors";
import { getPackagePricing, formatPackagePricing } from "@/lib/pricing";
import type {
  BookingFormData,
  PackageId,
  PaymentFormData,
} from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import {
  createBookingSchema,
  createPaymentSchema,
  packagePrices,
} from "@/lib/validations";
import { useYandexMetrica } from "@/components/analytics/yandex-metrica";

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
  const [paymentMethod, setPaymentMethod] = useState<"iyzico" | "turinvoice">(
    "iyzico",
  );
  const [turinvoiceOrder, setTurinvoiceOrder] = useState<{
    idOrder: number;
    paymentUrl: string;
    amountTRY: number;
    amountEUR: number;
    exchangeRate: number;
  } | null>(null);

  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Unique Event ID for Facebook Deduplication (Purchase Event)
  const [eventId, setEventId] = useState<string>("");

  // IndexNow integration for automatic URL submission
  const { notifyBookingCreated } = useIndexNow();
  const { trackPurchase: trackYandexPurchase } = useYandexMetrica();

  // Calculate pricing for display in the main component
  const pricing = selectedPackage
    ? getPackagePricing(
      selectedPackage,
      undefined,
      preFilledBookingData?.bookingDate,
      selectedPackage === "rooftop" ? preFilledBookingData?.peopleCount : undefined
    )
    : null;

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

  // Initialize with package from URL params or load from sessionStorage
  useEffect(() => {
    // Generate Event ID only once on mount
    if (!eventId) {
      setEventId(crypto.randomUUID());
    }

    // 1. Try to get package from URL
    const packageParam = searchParams.get("package") as PackageId;
    let effectivePackageId = (packageParam && packageParam in packagePrices) ? packageParam : null;

    // 2. Load pre-filled booking data from sessionStorage
    const storedBookingData = typeof window !== 'undefined' ? sessionStorage.getItem("bookingData") : null;

    if (storedBookingData) {
      try {
        const storedData = JSON.parse(storedBookingData);
        // Safely check for bookingId (extra field not in BookingFormData schema)
        if (storedData && typeof storedData === 'object' && 'bookingId' in storedData) {
          setBookingId(storedData.bookingId as string);
        }

        const bookingData = storedData as BookingFormData;
        setPreFilledBookingData(bookingData);

        // Pre-fill the form with stored data
        Object.keys(bookingData).forEach((key) => {
          bookingForm.setValue(
            key as keyof BookingFormData,
            bookingData[key as keyof BookingFormData],
          );
        });



        // Fallback: If URL didn't have package, but Session does, use that
        if (!effectivePackageId && bookingData.packageId && bookingData.packageId in packagePrices) {
          effectivePackageId = bookingData.packageId as PackageId;
        }

      } catch (error) {
        console.error("Error loading booking data from sessionStorage:", error);
      }
    }

    if (effectivePackageId) {
      setSelectedPackage(effectivePackageId);
    } else {
      // If no valid package found in URL or Session, redirect
      router.push("/packages");
    }
  }, [searchParams, bookingForm, router, eventId]);

  const packageInfo = selectedPackage
    ? {
      name: _tPackages(`${selectedPackage}.title`),
      price: preFilledBookingData?.totalAmount || packagePrices[selectedPackage], // Use pre-calculated amount
      duration: _tPackages(`${selectedPackage}.duration`),
      photos: _tPackages(`${selectedPackage}.photos`),
      locations: _tPackages(`${selectedPackage}.locations`),
      features: _tPackages.raw(`${selectedPackage}.features`) as string[],
    }
    : null;

  // Track begin_checkout when component mounts with package data
  useEffect(() => {
    if (selectedPackage && packageInfo && eventId) {
      trackBeginCheckout(
        selectedPackage,
        packageInfo.name,
        packageInfo.price,
        "EUR",
        eventId
      );
    }
  }, [selectedPackage, packageInfo, eventId]);

  const handlePaymentSubmit = async (paymentData: PaymentFormData) => {
    if (!selectedPackage || !packageInfo) return;

    setIsLoading(true);

    // Get booking data once at the beginning - outside try block
    const bookingData = bookingForm.getValues();

    // Track add payment info event
    trackAddPaymentInfo(selectedPackage, packageInfo.name, packageInfo.price);

    // Calculate pricing to get deposit amount
    const pricing = getPackagePricing(
      selectedPackage,
      undefined,
      bookingData.bookingDate,
      selectedPackage === "rooftop" ? bookingData.peopleCount : undefined
    );

    try {
      // Step 1: Initialize payment FIRST (no booking creation yet)
      const paymentResponse = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentData,
          customerData: bookingData,
          amount: pricing.depositAmount, // CHARGE ONLY DEPOSIT
          packageId: selectedPackage,
          locale,
          eventId, // Pass Event ID to backend for CAPI
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
            totalAmount: bookingData.totalAmount, // Ensure totalAmount is correct
            paymentId: paymentResult.paymentId,
            conversationId: paymentResult.conversationId,
            providerResponse: paymentResult.providerResponse, // Pass full provider response
            eventId, // Required for CAPI Deduplication
            bookingId: bookingId || undefined, // Pass existing booking ID to avoid duplication
          }),
        });

        if (!bookingResponse.ok) {
          throw new Error(t("error.booking_failed"));
        }

        const bookingResult = await bookingResponse.json();

        setBookingId(bookingResult.booking.id);
        setConfirmedBooking(bookingResult.booking);
        setShowSuccess(true);
        toast.success(t("success.payment_successful"));

        // Clear booking data from sessionStorage
        sessionStorage.removeItem("bookingData");

        // Notify search engines about new booking (IndexNow)
        try {
          await notifyBookingCreated(bookingResult.booking.id);
        } catch (indexNowError) {
          // Don't break the flow if IndexNow fails
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
          packageInfo.name,
          packagePrices[selectedPackage],
          "EUR",
          undefined,
          eventId,
        );

        // Track Facebook Purchase
        fbPixel.trackPurchase(
          selectedPackage,
          packagePrices[selectedPackage],
          bookingResult.booking.id,
          eventId,
        );
        trackFacebookEvent(
          "Purchase",
          {
            email: bookingData.customerEmail,
            phone: bookingData.customerPhone,
            packageId: selectedPackage,
            amount: packagePrices[selectedPackage],
            transactionId: bookingResult.booking.id,
          },
          eventId,
        );

        // Track Yandex Purchase
        trackYandexPurchase(
          bookingResult.booking.id,
          selectedPackage,
          packagePrices[selectedPackage],
        );

        // Trigger Chatbot Success Message
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("booking_confirmed", {
            detail: {
              customerName: bookingData.customerName,
              bookingDate: bookingData.bookingDate,
              packageId: selectedPackage
            }
          }));
        }
      } else {
        // Payment failed - no booking created, user can retry
        trackPaymentEvent(
          selectedPackage,
          packagePrices[selectedPackage],
          "failure",
        );

        // Handle Iyzico error with localized message
        const errorCode = paymentResult.errorCode;

        if (errorCode) {
          const iyzicoError = getIyzicoErrorMessage(errorCode, locale);
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

  const handleTurinvoiceInitialize = async () => {
    if (!selectedPackage || !packageInfo) return;

    setIsLoading(true);
    const bookingData = bookingForm.getValues();

    // Calculate pricing to get deposit amount
    const pricing = getPackagePricing(
      selectedPackage,
      undefined,
      bookingData.bookingDate,
      selectedPackage === "rooftop" ? bookingData.peopleCount : undefined
    );

    try {
      const response = await fetch("/api/payment/initialize/turinvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerData: bookingData,
          amount: pricing.depositAmount, // CHARGE ONLY DEPOSIT
          packageId: selectedPackage,
          locale,
          eventId,
        }),
      });

      if (!response.ok) {
        throw new Error(t("error.payment_init_failed"));
      }

      const data = await response.json();

      if (data.success) {
        setTurinvoiceOrder({
          idOrder: data.idOrder,
          paymentUrl: data.paymentUrl,
          amountTRY: data.amountTRY,
          amountEUR: data.amountEUR,
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

    try {
      const bookingResponse = await fetch("/api/booking/create-confirmed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bookingData,
          totalAmount: bookingData.totalAmount, // Ensure totalAmount is correct and positive
          paymentId: turinvoiceOrder.idOrder.toString(),
          conversationId: `turinvoice_${turinvoiceOrder.idOrder}`,
          provider: "turinvoice",
          eventId, // Required for CAPI Deduplication
          bookingId: bookingId || undefined, // Pass existing booking ID to avoid duplication
        }),
      });

      if (!bookingResponse.ok) {
        throw new Error(t("error.booking_failed"));
      }

      const bookingResult = await bookingResponse.json();

      setBookingId(bookingResult.booking.id);
      setConfirmedBooking(bookingResult.booking);
      setShowSuccess(true);
      toast.success(t("success.payment_successful"));

      sessionStorage.removeItem("bookingData");

      try {
        await notifyBookingCreated(bookingResult.booking.id);
      } catch (indexNowError) {
        // Ignore
      }

      // Track successful payment
      trackPaymentEvent(
        selectedPackage,
        packagePrices[selectedPackage],
        "success",
      );
      trackPurchase(
        bookingResult.booking.id,
        selectedPackage,
        packageInfo.name,
        packagePrices[selectedPackage],
        "EUR",
        undefined,
        eventId,
      );

      fbPixel.trackPurchase(
        selectedPackage,
        packagePrices[selectedPackage],
        bookingResult.booking.id,
        eventId,
      );

      // Track Yandex Purchase
      trackYandexPurchase(
        bookingResult.booking.id,
        selectedPackage,
        packagePrices[selectedPackage],
      );
    } catch (error) {
      console.error("Booking creation error:", error);
      toast.error(t("error.booking_failed"));
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
        {selectedPackage === "rooftop" && preFilledBookingData?.peopleCount && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("labels.people_count")}</span>
            <span className="font-medium">
              {preFilledBookingData.peopleCount} {preFilledBookingData.peopleCount === 1 ? t("person") : t("people")}
            </span>
          </div>
        )}
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

    const pricing = formatPackagePricing(
      selectedPackage,
      locale,
      undefined,
      preFilledBookingData?.bookingDate, // Pass the date to calculate discounts
      selectedPackage === "rooftop" ? preFilledBookingData?.peopleCount : undefined
    );

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
              className="bg-success/15 text-success border-success/20"
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
            {/* Subtotal: Show original price */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                {translations("subtotal")}
                {selectedPackage === "rooftop" && preFilledBookingData?.peopleCount && (
                  <span className="text-xs block text-muted-foreground/80">
                    ({preFilledBookingData.peopleCount} {preFilledBookingData.peopleCount === 1 ? t("person") : t("people")})
                  </span>
                )}
              </span>
              <span>{pricing.originalPrice}</span>
            </div>

            {pricing.isDiscounted && (
              <div className="flex justify-between items-center text-sm text-success font-medium">
                <span>{t("seasonal_discount_applied", { percentage: (pricing.appliedDiscountPercentage * 100).toFixed(0) })}</span>
                <span>-{pricing.discountAmount}</span>
              </div>
            )}

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

            <div className="bg-primary/5 p-3 rounded-md mt-4 border border-primary/20">
              <div className="flex justify-between items-center font-bold text-primary">
                <span>{t("labels.deposit_amount")} (30%)</span>
                <span>{pricing.depositAmount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("payment.secure_no_fees")}
              </p>
            </div>

            <div className="flex justify-between items-center text-sm text-muted-foreground px-3">
              <span>{t("labels.remaining_cash")} (70%)</span>
              <span>{pricing.remainingAmount}</span>
            </div>

          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {translations("tax_inclusive")} ({pricing.taxAmount} {translations("vat")})
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
        confirmedBooking={confirmedBooking}
      />
    );
  }

  if (!preFilledBookingData || !selectedPackage) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 max-w-6xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">{t("loading_booking")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 max-w-6xl">
      <div className="animate-fade-in-up">
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
                <span className="w-2 h-2 bg-success rounded-full"></span>
                {t("security.ssl_encrypted")}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                {t("security.secure_payment")}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-success rounded-full"></span>
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

              {/* Payment Method Selection - Mobile */}
              <Card className="border-2 border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">
                        💳
                      </span>
                    </div>
                    {t("payment_method")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`relative flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 ${paymentMethod === "iyzico"
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-card"
                        }`}
                      onClick={() => setPaymentMethod("iyzico")}
                    >
                      <div className="h-10 sm:h-12 flex items-center justify-center mb-2 relative w-full">
                        <Image
                          src="/pay_with_iyzico_colored.svg"
                          alt="Iyzico"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="font-medium text-xs text-center">
                        {t("payment_methods.credit_card")}
                      </span>
                      {paymentMethod === "iyzico" && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    <div
                      className={`relative flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 ${paymentMethod === "turinvoice"
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-card"
                        }`}
                      onClick={() => setPaymentMethod("turinvoice")}
                    >
                      <div className="h-12 sm:h-14 flex items-center justify-center mb-2 relative w-full">
                        <Image
                          src="/turinvoice_logo.webp"
                          alt="Turinvoice"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="font-medium text-xs text-center">
                        {t("payment_methods.russian_banks")}
                      </span>
                      {paymentMethod === "turinvoice" && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>


                  </div>
                </CardContent>
              </Card>

              {/* Payment Form or Turinvoice Component - Mobile */}
              <Card className="border-2 border-primary/10">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                  <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">
                        🔒
                      </span>
                    </div>
                    {t("payment_details")}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("payment.complete_description")}
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  {paymentMethod === "iyzico" ? (
                    <Form {...paymentForm}>
                      <PaymentForm
                        form={paymentForm}
                        onSubmit={handlePaymentSubmit}
                        selectedPackage={selectedPackage}
                        bookingData={preFilledBookingData}
                        isLoading={isLoading}
                      />
                    </Form>
                  ) : paymentMethod === "turinvoice" ? (
                    <div className="space-y-6">
                      {!turinvoiceOrder ? (
                        <div className="text-center space-y-4 py-4">
                          <p className="text-muted-foreground text-sm">
                            {t("turinvoice_description")}
                          </p>
                          <Button
                            size="lg"
                            className="w-full"
                            onClick={handleTurinvoiceInitialize}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {t("buttons.processing")}
                              </>
                            ) : (
                              t("buttons.pay_amount", {
                                amount: pricing ? formatCurrency(pricing.depositAmount, locale) : ""
                              })
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

                  {/* Payment Method Selection */}
                  <Card className="border-2 border-primary/10">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-bold">
                            💳
                          </span>
                        </div>
                        {t("payment_method")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                          className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 ${paymentMethod === "iyzico"
                            ? "border-primary bg-primary/5"
                            : "border-muted bg-card"
                            }`}
                          onClick={() => setPaymentMethod("iyzico")}
                        >
                          <div className="h-10 sm:h-12 flex items-center justify-center mb-3">
                            <img
                              src="/pay_with_iyzico_colored.svg"
                              alt="Iyzico"
                              className="h-6 sm:h-7 w-auto max-w-full object-contain"
                            />
                          </div>
                          <span className="font-medium text-sm text-center">
                            {t("payment_methods.credit_card")}
                          </span>
                          {paymentMethod === "iyzico" && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>

                        <div
                          className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 ${paymentMethod === "turinvoice"
                            ? "border-primary bg-primary/5"
                            : "border-muted bg-card"
                            }`}
                          onClick={() => setPaymentMethod("turinvoice")}
                        >
                          <div className="h-14 sm:h-16 flex items-center justify-center mb-3">
                            <img
                              src="/turinvoice_logo.webp"
                              alt="Turinvoice"
                              className="h-10 sm:h-12 w-auto max-w-full object-contain"
                            />
                          </div>
                          <span className="font-medium text-sm text-center">
                            {t("payment_methods.russian_banks")}
                          </span>
                          {paymentMethod === "turinvoice" && (
                            <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>


                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Form or Turinvoice Component */}
                  <Card className="border-2 border-primary/10">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                      <CardTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-sm font-bold">
                            🔒
                          </span>
                        </div>
                        {t("payment_details")}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm mt-1">
                        {t("payment.complete_description")}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {paymentMethod === "iyzico" ? (
                        <Form {...paymentForm}>
                          <PaymentForm
                            form={paymentForm}
                            onSubmit={handlePaymentSubmit}
                            selectedPackage={selectedPackage}
                            bookingData={preFilledBookingData}
                            isLoading={isLoading}
                          />
                        </Form>
                      ) : paymentMethod === "turinvoice" ? (
                        <div className="space-y-6">
                          {!turinvoiceOrder ? (
                            <div className="text-center space-y-4 py-4">
                              <p className="text-muted-foreground">
                                {t("turinvoice_description")}
                              </p>
                              <Button
                                size="lg"
                                className="w-full sm:w-auto min-w-[200px]"
                                onClick={handleTurinvoiceInitialize}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t("buttons.processing")}
                                  </>
                                ) : (
                                  t("buttons.pay_amount", {
                                    amount: pricing ? formatCurrency(pricing.depositAmount, locale) : ""
                                  })
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
      </div>
    </div>
  );
}
