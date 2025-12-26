"use client";

import { format } from "date-fns";
import { ar, de, enUS, es, fr, ro, ru, zhCN } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";
import type { BookingFormData, PackageId } from "@/lib/validations";
import { packagePrices } from "@/lib/validations";

interface CustomerDetailsFormProps {
  form: UseFormReturn<BookingFormData>;
  onSubmit: (data: BookingFormData) => void;
  selectedPackage: PackageId | null;
  onBack: () => void;
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

export function CustomerDetailsForm({
  form,
  onSubmit,
  selectedPackage,
  onBack,
}: CustomerDetailsFormProps) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tPackages = useTranslations("packages");
  const tui = useTranslations("ui");
  const tplaceholders = useTranslations("placeholders");
  const tsuccess = useTranslations("success");

  const [showTimeSelection, setShowTimeSelection] = useState(() => {
    return !!form.getValues("bookingDate");
  });

  // Get the appropriate date-fns locale
  const dateFnsLocale = getDateFnsLocale(locale);

  const handleSubmit = form.handleSubmit(onSubmit);

  if (!selectedPackage) {
    return null;
  }

  const packageInfo = {
    name: tPackages(`${selectedPackage}.title`),
    price: packagePrices[selectedPackage],
    duration: tPackages(`${selectedPackage}.duration`),
    photos: tPackages(`${selectedPackage}.photos`),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Customer Details Form */}
      <div className="lg:col-span-2 space-y-4 lg:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {t("customer_details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 lg:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
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

              <Separator />

              <div className="space-y-3 lg:space-y-4">
                <h3 className="text-base lg:text-lg font-semibold">
                  {t("booking_details")}
                </h3>

                <div className="space-y-4 lg:space-y-6">
                  {/* Combined Date & Time Selection */}
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

                          {/* Calendar Widget - Responsive with Natural Sizing */}
                          <div className="flex justify-center w-full">
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
                              className="rounded-lg border shadow-sm bg-background"
                              classNames={{
                                months: "flex flex-col sm:flex-row gap-4",
                                month: "space-y-4",
                                caption:
                                  "flex justify-center pt-1 relative items-center mb-4",
                                caption_label: "text-base font-semibold",
                                nav: "space-x-1 flex items-center",
                                nav_button: cn(
                                  "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-accent rounded-md transition-all",
                                ),
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell:
                                  "text-muted-foreground rounded-md w-9 font-normal text-sm text-center",
                                row: "flex w-full mt-2",
                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: cn(
                                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground rounded-md transition-colors",
                                ),
                                day_range_end: "day-range-end",
                                day_selected:
                                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                day_today: "bg-accent text-accent-foreground",
                                day_outside:
                                  "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                day_disabled:
                                  "text-muted-foreground opacity-50",
                                day_range_middle:
                                  "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                day_hidden: "invisible",
                              }}
                            />
                          </div>

                          {/* Time Selection - Appears below calendar */}
                          {showTimeSelection && (
                            <div className="space-y-3 animate-fade-in">
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
                                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 max-w-2xl mx-auto">
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
                                          "h-10 sm:h-11 flex items-center justify-center gap-1 text-xs sm:text-sm font-medium transition-all min-w-0 px-1.5 sm:px-2",
                                          timeField.value === time
                                            ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-1"
                                            : "hover:bg-muted hover:text-foreground hover:border-primary/50",
                                        )}
                                        onClick={() => timeField.onChange(time)}
                                      >
                                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                        <span className="truncate">{time}</span>
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
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="h-12 px-6 text-sm font-medium"
                >
                  {t("buttons.back")}
                </Button>
                <Button type="submit" className="h-12 px-6 text-sm font-medium">
                  {t("buttons.continue")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Package Summary Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("package_summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{packageInfo.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {packageInfo.duration}
                </p>
                <p className="text-sm text-muted-foreground">
                  {packageInfo.photos}
                </p>
              </div>
              <Badge variant="secondary">{tui("selected")}</Badge>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-semibold">{tui("total")}:</span>
              <span className="text-xl font-bold text-primary">
                €{packageInfo.price}
              </span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>{tsuccess("bullet_professional")}</p>
              <p>{tsuccess("bullet_photos")}</p>
              <p>{tsuccess("bullet_gallery")}</p>
              <p>{tsuccess("bullet_retouching")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-2">{tsuccess("need_help")}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {tsuccess("help_description")}
            </p>
            <div className="text-sm space-y-1">
              <p>📧 info@istanbulportrait.com</p>
              <p>📞 +90 536 709 37 24</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
