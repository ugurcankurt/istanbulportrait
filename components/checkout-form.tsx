"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Form } from "@/components/ui/form";

import { PackageDetails } from "@/components/package-details";
import { CustomerDetailsForm } from "@/components/customer-details-form";
import { PaymentForm } from "@/components/payment-form";
import { BookingSuccess } from "@/components/booking-success";

import { bookingSchema, paymentSchema, packagePrices } from "@/lib/validations";
import type { BookingFormData, PaymentFormData, PackageId } from "@/lib/validations";

const steps = ["package", "details", "payment", "confirmation"] as const;
type Step = (typeof steps)[number];

export function CheckoutForm() {
  const searchParams = useSearchParams();
  const t = useTranslations("checkout");
  const tPackages = useTranslations("packages");

  const [currentStep, setCurrentStep] = useState<Step>("package");
  const [selectedPackage, setSelectedPackage] = useState<PackageId | null>(null);
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
    setCurrentStep("details");
  };

  const handleDetailsSubmit = (data: BookingFormData) => {
    console.log("Booking details:", data);
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
      } else {
        throw new Error(paymentResult.errorMessage || t("error.payment_failed"));
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : t("error.payment_failed"));
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
    return <BookingSuccess bookingId={bookingId} packageId={selectedPackage!} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl lg:max-w-6xl xl:max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">{t("title")}</CardTitle>
            <p className="text-muted-foreground">{t("description")}</p>
            
            <div className="mt-6">
              <Progress value={progressPercentage} className="w-full" />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
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

          <CardContent>
            <Tabs value={currentStep} onValueChange={handleStepChange}>
              <TabsList className="grid w-full grid-cols-4">
                {steps.map((step, index) => (
                  <TabsTrigger
                    key={step}
                    value={step}
                    disabled={index > getCurrentStepIndex()}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {t(`steps.${step}`)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-8">
                <TabsContent value="package" className="space-y-6">
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

                <TabsContent value="details" className="space-y-6">
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

                <TabsContent value="payment" className="space-y-6">
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