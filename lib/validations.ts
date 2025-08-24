import { z } from "zod";

export const bookingSchema = z.object({
  packageId: z.string().min(1, "validation.package_required"),
  customerName: z.string().min(2, "validation.name_min"),
  customerEmail: z.string().email({ message: "validation.email_invalid" }),
  customerPhone: z.string().min(1, "validation.phone_required"),
  bookingDate: z.string().min(1, "validation.date_required"),
  bookingTime: z.string().min(1, "validation.time_required"),
  notes: z.string().optional(),
  totalAmount: z.number().positive("validation.amount_positive"),
});

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
      { message: "validation.card_number_invalid" }
    ),
  expireMonth: z.string().min(2, "validation.month_required").max(2),
  expireYear: z.string().min(2, "validation.year_required").max(2),
  cvc: z.string().min(3, "validation.cvc_required").max(4),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;

export const packagePrices = {
  essential: 150,
  premium: 280,
  luxury: 450,
  rooftop: 150,
} as const;

export type PackageId = keyof typeof packagePrices;
