"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createPaymentSchema, PaymentFormData } from "@/lib/validations";
import { PaymentForm } from "@/components/payment-form";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

export function B2BClientCheckout({ booking }: { booking: any }) {
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const { formatPrice } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const paymentSchemaWithTranslations = createPaymentSchema(tValidation);
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchemaWithTranslations),
    defaultValues: {
      cardHolderName: "",
      cardNumber: "",
      expireMonth: "",
      expireYear: "",
      cvc: "",
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/payment/b2b-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentData: data,
          locale,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Payment failed");
      }

      setIsSuccess(true);
      toast.success("Payment successful! Booking confirmed.");
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-100">Payment Successful!</h2>
        <p className="text-slate-400">The booking has been confirmed via OCTO API.</p>
      </div>
    );
  }

  // Create dummy bookingData to satisfy the PaymentForm props
  // It only needs peopleCount and bookingDate to prevent crashes in getPackagePricing.
  const dummyBookingData: any = {
    bookingDate: booking.booking_date,
    peopleCount: booking.people_count,
    basePrice: booking.total_amount, // Hack to force the total_amount into the pricing calc
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-[#0a0a0a] rounded-2xl border border-slate-800 shadow-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">B2B Order Payment</h1>
        <p className="text-sm text-slate-400">
          Booking Ref: <span className="text-violet-400">{booking.id.split("-")[0]}</span>
        </p>
        <div className="mt-4 p-4 bg-violet-900/20 rounded-xl border border-violet-500/20">
          <p className="text-xs font-semibold text-violet-300 uppercase tracking-wide">Net Price to Pay</p>
          <p className="text-3xl font-bold text-white">{formatPrice(booking.total_amount)}</p>
        </div>
      </div>

      <PaymentForm
        form={form}
        onSubmit={onSubmit}
        selectedPackage={booking.package_id}
        bookingData={dummyBookingData}
        isLoading={isLoading}
        computedSurchargePercentage={0} // We already have the final total_amount
      />
    </div>
  );
}
