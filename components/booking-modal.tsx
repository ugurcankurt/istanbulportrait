"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ar, de, enUS, es, fr, ro, ru, zhCN } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  Image as ImageIcon,
  MapPin,
  Users,
  Info,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { useYandexMetrica } from "@/components/analytics/yandex-metrica";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
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
import { Textarea } from "@/components/ui/textarea";
import { trackLead } from "@/lib/analytics";
import { fbPixel } from "@/lib/facebook";
import { cn } from "@/lib/utils";
import type { BookingFormData, PackageId } from "@/lib/validations";
import { createBookingSchema, packagePrices } from "@/lib/validations";
import { getPackagePricing } from "@/lib/pricing";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: PackageId | null;
}

// Generate time slots from 6 AM to 6 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 18; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 18) {
      slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

// Locale mapping for date-fns
const getDateFnsLocale = (locale: string) => {
  switch (locale) {
    case "ar":
      return ar;
    case "es":
      return es;
    case "ru":
      return ru;
    case "fr":
      return fr;
    case "de":
      return de;
    case "zh":
      return zhCN;
    case "ro":
      return ro;
    default:
      return enUS;
  }
};

export function BookingModal({
  isOpen,
  onClose,
  selectedPackage,
}: BookingModalProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("checkout");
  const tPackages = useTranslations("packages");
  const tui = useTranslations("ui");
  const tplaceholders = useTranslations("placeholders");
  const tValidation = useTranslations("validation");

  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get the appropriate date-fns locale
  const dateFnsLocale = getDateFnsLocale(locale);

  // Create schema with translations
  const bookingSchemaWithTranslations = createBookingSchema(tValidation);
  const { trackBookingStart, trackPackageView } = useYandexMetrica();
  const [step, setStep] = useState<"details" | "summary">("details");

  // Track package view when modal opens
  useEffect(() => {
    if (isOpen && selectedPackage) {
      trackPackageView(selectedPackage);
    }
  }, [isOpen, selectedPackage, trackPackageView]);

  const form = useForm<BookingFormData>({
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
      peopleCount: 1,
    },
  });

  // Update form values when selectedPackage changes
  // Calculate pricing based on selected package and date
  const [pricing, setPricing] = useState<{
    totalPrice: number;
    originalPrice: number;
    isDiscounted: boolean;
    discountPercentage: number;
    depositAmount: number;
    remainingAmount: number;
  } | null>(null);

  // Update pricing when package or date changes
  useEffect(() => {
    if (selectedPackage) {
      form.setValue("packageId", selectedPackage);
      const dateValue = form.getValues("bookingDate");

      // Use people count for rooftop, undefined for others
      const count = selectedPackage === "rooftop" ? peopleCount : undefined;

      const priceBreakdown = getPackagePricing(selectedPackage, undefined, dateValue, count);

      setPricing({
        totalPrice: priceBreakdown.totalPrice,
        originalPrice: priceBreakdown.originalPrice,
        isDiscounted: priceBreakdown.isDiscounted,
        discountPercentage: priceBreakdown.appliedDiscountPercentage,
        depositAmount: priceBreakdown.depositAmount,
        remainingAmount: priceBreakdown.remainingAmount,
      });

      form.setValue("totalAmount", priceBreakdown.totalPrice); // Full price is stored in form

      // Set peopleCount for rooftop
      if (selectedPackage === "rooftop") {
        form.setValue("peopleCount", peopleCount);
      }
    }
  }, [selectedPackage, peopleCount, form.watch("bookingDate"), form]); // Watch date and peopleCount changes

  const packageInfo = selectedPackage
    ? {
      name: tPackages(`${selectedPackage}.title`),
      price: pricing?.totalPrice || packagePrices[selectedPackage],
      originalPrice: pricing?.originalPrice || packagePrices[selectedPackage],
      isDiscounted: pricing?.isDiscounted || false,
      discountPercentage: pricing?.discountPercentage || 0,
      depositAmount: pricing?.depositAmount || 0,
      remainingAmount: pricing?.remainingAmount || 0,
      duration: tPackages(`${selectedPackage}.duration`),
      photos: tPackages(`${selectedPackage}.photos`),
      locations: tPackages(`${selectedPackage}.locations`),
      features: tPackages.raw(`${selectedPackage}.features`) as string[],
    }
    : null;

  const handleSubmit = form.handleSubmit(
    async (data) => {
      // Track lead conversion - user filled booking form
      if (selectedPackage && packageInfo) {
        // Generate unique event ID for deduplication
        const eventId = crypto.randomUUID();

        // GA4 Lead Event
        trackLead(
          selectedPackage,
          packageInfo.name,
          packageInfo.price,
          "EUR",
          eventId,
        );

        // Track Booking Start Event
        trackBookingStart(selectedPackage);

        // Track InitiateCheckout with Facebook Pixel
        fbPixel.trackInitiateCheckout(selectedPackage, packageInfo.price, eventId);

        // --- NEW: Save Draft Booking to Supabase (Background) ---
        try {
          // Wait for draft creation to get the booking ID
          const draftResponse = await fetch("/api/booking/create-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              totalAmount: pricing?.totalPrice || packagePrices[selectedPackage],
              locale, // Send current locale
            }),
          });

          const draftResult = await draftResponse.json();
          if (draftResult.bookingId) {
            // Add bookingId to the data stored in session
            const bookingDataWithId = {
              ...data,
              bookingId: draftResult.bookingId,
            };
            sessionStorage.setItem("bookingData", JSON.stringify(bookingDataWithId));
          } else {
            sessionStorage.setItem("bookingData", JSON.stringify(data));
          }
        } catch (e) {
          // Ignore draft errors to not block checkout, just store form data
          console.error("Draft creation error:", e);
          sessionStorage.setItem("bookingData", JSON.stringify(data));
        }

        // Navigate to checkout page
        try {
          setIsNavigating(true);
          router.push(`/checkout?package=${selectedPackage}`);
          // Don't close modal here to allow spinner to show during redirect
        } catch (error) {
          setIsNavigating(false);
        }
      }
    },
    (errors) => {
      // Form validation errors
      console.error(errors);
    },
  );

  const handleClose = () => {
    form.reset();
    setShowTimeSelection(false);
    setIsNavigating(false);
    onClose();
  };

  if (!selectedPackage || !packageInfo) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto"
        showCloseButton={true}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            {t("booking_details")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("modal_description")}{" "}
            <span className="font-semibold">{packageInfo.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Details Form */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t("customer_details")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form.name")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={tplaceholders("enter_full_name")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form.email")}</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder={tplaceholders("enter_email")}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.phone")}</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              defaultCountry="TR"
                              placeholder={tplaceholders("phone_number")}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* People Count Selector - Only for Rooftop Package */}
                {selectedPackage === "rooftop" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {t("people_count_title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="peopleCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("form.people_count")}</FormLabel>
                            <Select
                              value={peopleCount.toString()}
                              onValueChange={(value) => {
                                const count = parseInt(value);
                                setPeopleCount(count);
                                field.onChange(count);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    {num} {num === 1 ? t("person") : t("people")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Price breakdown */}
                      {pricing && (
                        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {t("price_per_person")}
                            </span>
                            <span className="font-medium">
                              €{(pricing.totalPrice / peopleCount).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold text-primary">
                            <span>
                              {peopleCount} × {t("person")}
                            </span>
                            <span>
                              €{pricing.totalPrice.toFixed(2)}
                            </span>
                          </div>
                          {pricing.isDiscounted && (
                            <div className="pt-2 border-t text-xs text-muted-foreground">
                              {t("seasonal_discount_applied", {
                                percentage: Math.round(pricing.discountPercentage * 100)
                              })}
                            </div>
                          )}

                          {/* Deposit Breakdown */}
                          <div className="pt-2 border-t mt-2 space-y-1">
                            <div className="flex justify-between text-xs sm:text-sm font-medium text-emerald-600">
                              <span>{t("labels.deposit_amount")} (30%)</span>
                              <span>€{(pricing.totalPrice * 0.30).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                              <span>{t("labels.remaining_cash")} (70%)</span>
                              <span>€{(pricing.totalPrice * 0.70).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {t("booking_details")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Date & Time Selection */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="bookingDate"
                        render={({ field: dateField }) => (
                          <FormItem className="space-y-4">
                            <FormLabel className="text-base font-semibold flex items-center gap-2">
                              <CalendarIcon className="w-5 h-5 text-primary" />
                              {showTimeSelection
                                ? t("form.date_time")
                                : t("form.date")}
                            </FormLabel>

                            {/* Calendar Widget */}
                            <Calendar
                              mode="single"
                              selected={
                                dateField.value
                                  ? new Date(dateField.value)
                                  : undefined
                              }
                              onSelect={(date) => {
                                const dateString = date
                                  ? format(date, "yyyy-MM-dd", {
                                    locale: dateFnsLocale,
                                  })
                                  : "";
                                dateField.onChange(dateString);
                                setShowTimeSelection(!!date);
                              }}
                              disabled={(date) =>
                                date < new Date() ||
                                date < new Date("1900-01-01")
                              }
                              locale={dateFnsLocale}
                              dir={locale === "ar" ? "rtl" : "ltr"}
                              className="w-full mx-auto"
                            />

                            {/* Time Selection */}
                            {showTimeSelection && (
                              <div className="space-y-3 animate-fade-in-up">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                                  <div className="h-px bg-border flex-1" />
                                  <Clock className="w-4 h-4" />
                                  <span>{t("form.select_time")}</span>
                                  <div className="h-px bg-border flex-1" />
                                </div>

                                <FormField
                                  control={form.control}
                                  name="bookingTime"
                                  render={({ field: timeField }) => (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-w-2xl mx-auto">
                                      {timeSlots.map((time) => (
                                        <Button
                                          key={time}
                                          type="button"
                                          variant={
                                            timeField.value === time
                                              ? "default"
                                              : "outline"
                                          }
                                          size="sm"
                                          className={cn(
                                            "h-10 flex items-center justify-center gap-1 text-xs font-medium transition-all",
                                            timeField.value === time
                                              ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-1"
                                              : "hover:bg-muted hover:text-foreground hover:border-primary/50",
                                          )}
                                          onClick={() =>
                                            timeField.onChange(time)
                                          }
                                        >
                                          <Clock className="w-3 h-3 flex-shrink-0" />
                                          <span>{time}</span>
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                />
                              </div>
                            )}

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("form.notes")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={tplaceholders("special_requests")}
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>

          {/* Package Summary Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("package_summary")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{packageInfo.name}</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{packageInfo.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="w-3 h-3" />
                        <span>{packageInfo.photos}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{packageInfo.locations}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{tui("selected")}</Badge>
                </div>

                {/* Key Features */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t("included_features") || "Included Features"}
                  </h4>
                  <ul className="space-y-1">
                    {packageInfo.features.slice(0, 4).map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-xs"
                      >
                        <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    {packageInfo.features.length > 4 && (
                      <li className="text-xs text-muted-foreground ml-5">
                        +{packageInfo.features.length - 4}{" "}
                        {t("more_features") || "more features"}
                      </li>
                    )}
                  </ul>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-semibold">{t("labels.total_amount")}</span>
                  <div className="text-right">
                    {packageInfo.isDiscounted && (
                      <div className="text-sm text-muted-foreground line-through">
                        €{packageInfo.originalPrice}
                      </div>
                    )}
                    <span className="text-xl font-bold text-primary">
                      €{packageInfo.price}
                    </span>
                    {packageInfo.isDiscounted && (
                      <Badge variant="secondary" className="ml-2 bg-success/15 text-success text-xs font-medium border-0">
                        -{packageInfo.discountPercentage * 100}% {tPackages("winter_sale")}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center p-2 bg-primary/5 rounded border border-primary/10">
                    <span className="font-medium text-primary text-sm">{t("labels.deposit_amount")} (30%)</span>
                    <span className="font-bold text-primary">
                      €{packageInfo.depositAmount}
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-2 text-sm text-muted-foreground">
                    <span>{t("labels.remaining_cash")} (70%)</span>
                    <span>
                      €{packageInfo.remainingAmount}
                    </span>
                  </div>
                </div>

                {/* Payment Terms Notice */}
                <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex gap-3 text-sm text-blue-900">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="leading-tight">
                    {t("labels.payment_terms_notice")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="pt-6 px-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="h-12 px-6"
            disabled={isNavigating || form.formState.isSubmitting}
          >
            {t("buttons.cancel")}
          </Button>
          <Button 
            type="submit" 
            className="h-12 px-8" 
            onClick={handleSubmit}
            disabled={isNavigating || form.formState.isSubmitting}
          >
            {(isNavigating || form.formState.isSubmitting) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("buttons.continue_to_payment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
