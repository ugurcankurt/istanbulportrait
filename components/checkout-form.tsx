"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BookingSuccess } from "@/components/booking-success";
import { CustomerDetailsForm } from "@/components/customer-details-form";
import { PackageDetails } from "@/components/package-details";
import { PaymentForm } from "@/components/payment-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  trackAddToCart,
  trackBeginCheckout,
  trackBookingEvent,
  trackPackageView,
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
import { bookingSchema, packagePrices, paymentSchema } from "@/lib/validations";

const steps = ["package", "details", "payment", "confirmation"] as const;
type Step = (typeof steps)[number];

export function CheckoutForm() {
  const _locale = useLocale();
  const searchParams = useSearchParams();
  const t = useTranslations("checkout");
  const _tPackages = useTranslations("packages");

  const [currentStep, setCurrentStep] = useState<Step>("package");
  const [selectedPackage, setSelectedPackage] = useState<PackageId | null>(
    null,
  );
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const bookingForm = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
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
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardHolderName: "",
      cardNumber: "",
      expireMonth: "",
      expireYear: "",
      cvc: "",
    },
  });

  // Initialize with package from URL params
  useEffect(() => {
    const packageParam = searchParams.get("package") as PackageId;
    if (packageParam && packageParam in packagePrices) {
      setSelectedPackage(packageParam);
      bookingForm.setValue("packageId", packageParam);
      bookingForm.setValue("totalAmount", packagePrices[packageParam]);
    }
  }, [searchParams, bookingForm]);

  const getStepIndex = (step: Step) => steps.indexOf(step);
  const getCurrentStepIndex = () => getStepIndex(currentStep);
  const progressPercentage = ((getCurrentStepIndex() + 1) / steps.length) * 100;

  const handlePackageSelect = (packageId: PackageId) => {
    setSelectedPackage(packageId);
    bookingForm.setValue("packageId", packageId);
    bookingForm.setValue("totalAmount", packagePrices[packageId]);

    // Track package selection with Enhanced Ecommerce
    trackPackageView(packageId);
    trackAddToCart(packageId, packagePrices[packageId]);

    // Track with Facebook Pixel (client-side only - no customer data needed)
    fbPixel.trackViewContent(packageId, packagePrices[packageId]);

    setCurrentStep("details");
  };

  const handleDetailsSubmit = (data: BookingFormData) => {
    console.log("Booking details:", data);

    // Track booking process started with Enhanced Ecommerce
    if (selectedPackage) {
      trackBookingEvent(selectedPackage, packagePrices[selectedPackage]);
      trackBeginCheckout(selectedPackage, packagePrices[selectedPackage]);

      // Track Lead with Facebook (booking form submission with customer data)
      fbPixel.trackLead(packagePrices[selectedPackage]);
      
      // Only send to Conversions API if we have customer email or phone
      if (data.customerEmail || data.customerPhone) {
        trackFacebookEvent("Lead", {
          email: data.customerEmail,
          phone: data.customerPhone,
          packageId: selectedPackage,
          amount: packagePrices[selectedPackage],
        });
      }
    }

    // Track InitiateCheckout when moving to payment step (only if we have customer data)
    if (selectedPackage) {
      fbPixel.trackInitiateCheckout(selectedPackage, packagePrices[selectedPackage]);
      if (data.customerEmail || data.customerPhone) {
        trackFacebookEvent("InitiateCheckout", {
          email: data.customerEmail,
          phone: data.customerPhone,
          packageId: selectedPackage,
          amount: packagePrices[selectedPackage],
        });
      }
    }

    setCurrentStep("payment");
  };

  const handlePaymentSubmit = async (paymentData: PaymentFormData) => {
    if (!selectedPackage) return;

    setIsLoading(true);
    try {
      const bookingData = bookingForm.getValues();

      // Create booking
      const bookingResponse = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (!bookingResponse.ok) {
        throw new Error(t("error.booking_failed"));
      }

      const bookingResult = await bookingResponse.json();

      // Initialize payment
      const paymentResponse = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingResult.booking.id,
          paymentData,
          customerData: bookingData,
          amount: packagePrices[selectedPackage],
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error(t("error.payment_init_failed"));
      }

      const paymentResult = await paymentResponse.json();

      if (paymentResult.status === "success") {
        setBookingId(bookingResult.booking.id);
        setCurrentStep("confirmation");
        toast.success(t("success.payment_successful"));

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
        const bookingData = bookingForm.getValues();
        fbPixel.trackPurchase(
          selectedPackage,
          packagePrices[selectedPackage],
          bookingResult.booking.id
        );
        trackFacebookEvent("Purchase", {
          email: bookingData.customerEmail,
          phone: bookingData.customerPhone,
          packageId: selectedPackage,
          amount: packagePrices[selectedPackage],
          transactionId: bookingResult.booking.id,
        });
      } else {
        // Track failed payment
        trackPaymentEvent(
          selectedPackage,
          packagePrices[selectedPackage],
          "failure",
        );
        throw new Error(
          paymentResult.errorMessage || t("error.payment_failed"),
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error ? error.message : t("error.payment_failed"),
      );

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

  const handleStepChange = (value: string) => {
    const step = value as Step;
    const stepIndex = getStepIndex(step);
    const currentIndex = getCurrentStepIndex();

    // Only allow going back or to current step
    if (stepIndex <= currentIndex) {
      setCurrentStep(step);
    }
  };

  if (currentStep === "confirmation" && bookingId) {
    return (
      <BookingSuccess bookingId={bookingId} packageId={selectedPackage!} />
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card>
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-3xl font-bold">
              {t("title")}
            </CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t("description")}
            </p>

            <div className="mt-4 sm:mt-6">
              <Progress value={progressPercentage} className="w-full" />
              <div className="flex justify-between mt-2 text-xs sm:text-sm text-muted-foreground">
                {steps.map((step, index) => (
                  <span
                    key={step}
                    className={
                      index <= getCurrentStepIndex()
                        ? "text-primary font-medium"
                        : ""
                    }
                  >
                    {t(`steps.${step}`)}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-6">
            <Tabs value={currentStep} onValueChange={handleStepChange}>
              <div className="mt-4 sm:mt-8">
                <TabsContent value="package" className="space-y-3 sm:space-y-6">
                  <motion.div
                    key={`package-${currentStep}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PackageDetails
                      selectedPackage={selectedPackage}
                      onPackageSelect={handlePackageSelect}
                    />
                  </motion.div>
                </TabsContent>

                <TabsContent value="details" className="space-y-3 sm:space-y-6">
                  <motion.div
                    key={`details-${currentStep}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Form {...bookingForm}>
                      <CustomerDetailsForm
                        form={bookingForm}
                        onSubmit={handleDetailsSubmit}
                        selectedPackage={selectedPackage}
                        onBack={() => setCurrentStep("package")}
                      />
                    </Form>
                  </motion.div>
                </TabsContent>

                <TabsContent value="payment" className="space-y-3 sm:space-y-6">
                  <motion.div
                    key={`payment-${currentStep}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Form {...paymentForm}>
                      <PaymentForm
                        form={paymentForm}
                        onSubmit={handlePaymentSubmit}
                        selectedPackage={selectedPackage}
                        bookingData={bookingForm.getValues()}
                        isLoading={isLoading}
                        onBack={() => setCurrentStep("details")}
                      />
                    </Form>
                  </motion.div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
