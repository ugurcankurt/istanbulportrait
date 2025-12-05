"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ar, enUS, es, ru } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Check,
  Clock,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { trackLead } from "@/lib/analytics";
import { fbPixel } from "@/lib/facebook";
import { cn } from "@/lib/utils";
import type { BookingFormData, PackageId } from "@/lib/validations";
import { createBookingSchema, packagePrices } from "@/lib/validations";

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

  // Get the appropriate date-fns locale
  const dateFnsLocale = getDateFnsLocale(locale);

  // Create schema with translations
  const bookingSchemaWithTranslations = createBookingSchema(tValidation);

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
    },
  });

  // Update form values when selectedPackage changes
  useEffect(() => {
    if (selectedPackage) {
      form.setValue("packageId", selectedPackage);
      form.setValue("totalAmount", packagePrices[selectedPackage]);
    }
  }, [selectedPackage, form]);

  const packageInfo = selectedPackage
    ? {
        name: tPackages(`${selectedPackage}.title`),
        price: packagePrices[selectedPackage],
        duration: tPackages(`${selectedPackage}.duration`),
        photos: tPackages(`${selectedPackage}.photos`),
        locations: tPackages(`${selectedPackage}.locations`),
        features: tPackages.raw(`${selectedPackage}.features`) as string[],
      }
    : null;

  const handleSubmit = form.handleSubmit(
    (data) => {
      // Track lead conversion - user filled booking form
      if (selectedPackage && packageInfo) {
        // GA4 Lead Event
        trackLead(selectedPackage, packageInfo.name, packageInfo.price);

        // Facebook Lead Event (client-side)
        fbPixel.trackLead(packageInfo.price);
      }

      // Store booking data in sessionStorage for checkout page
      sessionStorage.setItem("bookingData", JSON.stringify(data));

      // Navigate to checkout page
      try {
        router.push(`/checkout?package=${selectedPackage}`);

        // Close modal
        onClose();
      } catch (error) {
        // Navigation error
      }
    },
    (errors) => {
      // Form validation errors
    },
  );

  const handleClose = () => {
    form.reset();
    setShowTimeSelection(false);
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
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

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
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="space-y-3"
                              >
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
                              </motion.div>
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
                  <span className="font-semibold">{tui("total")}:</span>
                  <span className="text-xl font-bold text-primary">
                    €{packageInfo.price}
                  </span>
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
          >
            {t("buttons.cancel")}
          </Button>
          <Button type="submit" className="h-12 px-8" onClick={handleSubmit}>
            {t("buttons.continue_to_payment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
