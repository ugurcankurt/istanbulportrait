import { z } from "zod";

// Static schemas (original)
// Static schemas (original)
export const baseBookingSchema = z.object({
  packageId: z.string().min(1, "validation.package_required"),
  customerName: z.string().min(2, "validation.name_min"),
  customerEmail: z.string().email({ message: "validation.email_invalid" }),
  customerPhone: z.string().min(1, "validation.phone_required"),
  bookingDate: z.string().min(1, "validation.date_required"),
  bookingTime: z.string().min(1, "validation.time_required"),
  notes: z.string().optional(),
  totalAmount: z.number().positive("validation.amount_positive"),
  peopleCount: z.number().int().min(1).max(10).optional(),
});

export const bookingSchema = baseBookingSchema.refine(
  (data) => {
    // Rooftop package requires peopleCount
    if (data.packageId === "rooftop") {
      return data.peopleCount !== undefined && data.peopleCount >= 1 && data.peopleCount <= 10;
    }
    return true;
  },
  {
    message: "validation.people_count_required",
    path: ["peopleCount"],
  }
);

export const paymentSchema = z.object({
  cardHolderName: z.string().min(2, "validation.cardholder_required"),
  cardNumber: z
    .string()
    .min(1, "validation.card_number_required")
    .refine(
      (val) => {
        const digitsOnly = val.replace(/\D/g, "");
        return digitsOnly.length >= 13 && digitsOnly.length <= 19;
      },
      { message: "validation.card_number_invalid" },
    ),
  expireMonth: z.string().min(2, "validation.month_required").max(2),
  expireYear: z.string().min(2, "validation.year_required").max(2),
  cvc: z.string().min(3, "validation.cvc_required").max(4),
});

// Dynamic schemas with translations
export const createBookingSchema = (t: any) =>
  z.object({
    packageId: z.string().min(1, t("package_required")),
    customerName: z.string().min(2, t("name_min")),
    customerEmail: z.string().email({ message: t("email_invalid") }),
    customerPhone: z.string().min(1, t("phone_required")),
    bookingDate: z.string().min(1, t("date_required")),
    bookingTime: z.string().min(1, t("time_required")),
    notes: z.string().optional(),
    totalAmount: z.number().positive(t("amount_positive")),
    peopleCount: z.number().int().min(1).max(10).optional(),
  }).refine(
    (data) => {
      // Rooftop package requires peopleCount
      if (data.packageId === "rooftop") {
        return data.peopleCount !== undefined && data.peopleCount >= 1 && data.peopleCount <= 10;
      }
      return true;
    },
    {
      message: t("people_count_required"),
      path: ["peopleCount"],
    }
  );

export const createPaymentSchema = (t: any) =>
  z.object({
    cardHolderName: z.string().min(2, t("cardholder_required")),
    cardNumber: z
      .string()
      .min(1, t("card_number_required"))
      .refine(
        (val) => {
          const digitsOnly = val.replace(/\D/g, "");
          return digitsOnly.length >= 13 && digitsOnly.length <= 19;
        },
        { message: t("card_number_invalid") },
      ),
    expireMonth: z.string().min(2, t("month_required")).max(2),
    expireYear: z.string().min(2, t("year_required")).max(2),
    cvc: z.string().min(3, t("cvc_required")).max(4),
  });

export type BookingFormData = z.infer<typeof bookingSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;

// Package pricing (tax-inclusive prices in EUR)
export const packagePrices = {
  essential: 150,
  premium: 280,
  luxury: 450,
  rooftop: 150,
} as const;

export type PackageId = keyof typeof packagePrices;

// Tax-related types
export interface TaxInfo {
  rate: number;
  amount: number;
  included: boolean;
}

export interface PricingData {
  packageId: PackageId;
  basePrice: number;
  taxInfo: TaxInfo;
  totalPrice: number;
  currency: "EUR";
}

// Extended booking data with pricing breakdown
export interface BookingFormDataWithPricing extends BookingFormData {
  pricingData: PricingData;
}
