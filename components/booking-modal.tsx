"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ar, de, enUS, es, fr, ro, ru, tr as trLocale, zhCN } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useYandexMetrica } from "@/components/analytics/yandex-metrica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingCard } from "@/components/booking-card";
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
import { Textarea } from "@/components/ui/textarea";
import { trackLead, saveUserDataForAdvancedMatching, trackPackageAddToCart } from "@/lib/analytics";
import { getPackagePricing, matchActiveSurcharge } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { BookingFormData } from "@/lib/validations";
import { createBookingSchema } from "@/lib/validations";
import type { DiscountDB } from "@/lib/discount-service";
import type { TimeSurcharge } from "@/lib/availability-service";
import { useCurrency } from "@/contexts/currency-context";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar as CalendarIcon, Clock, Image as ImageIcon, Users, ChevronLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage: string | null;
  basePrice: number; // dynamically supplied from caller
  packageDisplayName: string; // dynamically supplied from caller
  initialDate?: string;
  initialTime?: string;
  initialPeopleCount?: number;
  packageDuration: string | number;
  packageLocations: number | string;
  packageFeatures: string[];
  packagePhotos: number | string;
  isPerPerson: boolean;
  activeDiscount: DiscountDB | null;
  timeSurcharges?: TimeSurcharge[];
}

// Generate time slots from 6 AM to 6 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour <= 20; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
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
    case "tr":
      return trLocale;
    default:
      return enUS;
  }
};

export function BookingModal({
  isOpen,
  onClose,
  selectedPackage,
  basePrice,
  packageDisplayName,
  initialDate,
  initialTime,
  initialPeopleCount = 1,
  packageDuration,
  packageLocations,
  packageFeatures,
  packagePhotos,
  isPerPerson,
  activeDiscount,
  timeSurcharges = [],
}: BookingModalProps) {
  const locale = useLocale();
  const { formatPrice, rate } = useCurrency();
  const router = useRouter();
  const t = useTranslations("checkout");
  const tPackages = useTranslations("packages");
  const tui = useTranslations("ui");
  const tplaceholders = useTranslations("placeholders");
  const tValidation = useTranslations("validation");

  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [peopleCount, setPeopleCount] = useState<number>(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const hasTrackedOpen = useRef(false);

  // Get the appropriate date-fns locale
  const dateFnsLocale = getDateFnsLocale(locale);

  // Create schema with translations
  const bookingSchemaWithTranslations = createBookingSchema(tValidation);
  const { trackBookingStart, trackPackageView } = useYandexMetrica();
  const [step, setStep] = useState<"selection" | "details" | "summary">("details");
  const isMobile = useIsMobile();

  // Set initial step for mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      // If date and time are already selected (e.g. from a previous interaction), 
      // maybe stay at details, but usually start at selection for clarity
      setStep("selection");
    } else if (isOpen) {
      setStep("details");
    }
  }, [isOpen, isMobile]);


  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchemaWithTranslations),
    defaultValues: {
      packageId: selectedPackage || "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      bookingDate: initialDate || "",
      bookingTime: initialTime || "",
      notes: "",
      totalAmount: 0,
      peopleCount: initialPeopleCount || 1,
    },
  });

  // Sync initial props when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        form.setValue("bookingDate", initialDate);
        setShowTimeSelection(true);
      }
      if (initialTime) {
        form.setValue("bookingTime", initialTime);
      }
      if (initialPeopleCount) {
        form.setValue("peopleCount", initialPeopleCount);
        setPeopleCount(initialPeopleCount);
      }
      if (selectedPackage) {
        form.setValue("packageId", selectedPackage);
      }
    }
  }, [isOpen, initialDate, initialTime, initialPeopleCount, selectedPackage, form]);

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

      // Use people count for packages with per-person pricing, undefined for others
      const count = isPerPerson ? peopleCount : undefined;
      const tValue = form.getValues("bookingTime");
      const activeSurcharge = matchActiveSurcharge(tValue, timeSurcharges);
      const surchargePercentage = activeSurcharge ? activeSurcharge.surcharge_percentage : 0;

      const priceBreakdown = getPackagePricing(
        selectedPackage,
        basePrice, // Passed from parent
        activeDiscount,
        null,
        dateValue,
        count,
        undefined,
        undefined,
        surchargePercentage
      );

      setPricing({
        totalPrice: priceBreakdown.totalPrice,
        originalPrice: priceBreakdown.originalPrice,
        isDiscounted: priceBreakdown.isDiscounted,
        discountPercentage: priceBreakdown.appliedDiscountPercentage,
        depositAmount: priceBreakdown.depositAmount,
        remainingAmount: priceBreakdown.remainingAmount,
      });

      form.setValue("totalAmount", priceBreakdown.totalPrice); // Full price is stored in form

      // Set peopleCount for per-person packages
      if (isPerPerson) {
        form.setValue("peopleCount", peopleCount);
      }
    }
  }, [selectedPackage, peopleCount, form.watch("bookingDate"), form.watch("bookingTime"), form]); // Watch date, time, and peopleCount changes

  const packageInfo = (selectedPackage && basePrice)
    ? {
      name: packageDisplayName || tPackages(`${selectedPackage}.title`), // Fallback just in case
      price: pricing?.totalPrice || basePrice,
      originalPrice: pricing?.originalPrice || basePrice,
      isDiscounted: pricing?.isDiscounted || false,
      discountPercentage: pricing?.discountPercentage || 0,
      depositAmount: pricing?.depositAmount || 0,
      remainingAmount: pricing?.remainingAmount || 0,
      duration: packageDuration,
      photos: packagePhotos,
      locations: packageLocations,
      features: packageFeatures,
    }
    : null;

  // Track package view when modal opens
  useEffect(() => {
    if (!isOpen) {
      hasTrackedOpen.current = false;
    } else if (isOpen && selectedPackage && packageInfo && !hasTrackedOpen.current) {
      hasTrackedOpen.current = true;
      trackPackageView(selectedPackage);
      trackPackageAddToCart(
        selectedPackage,
        packageInfo.name,
        packageInfo.price,
        "EUR"
      );
    }
  }, [isOpen, selectedPackage, packageInfo, trackPackageView]);

  const handleSubmit = form.handleSubmit(
    async (data) => {
      // Track lead conversion - user filled booking form
      if (selectedPackage && packageInfo) {
        // Save user data for advanced matching (Lead/Purchase Enhanced Conversions)
        const nameParts = data.customerName.split(" ");
        saveUserDataForAdvancedMatching({
          email: data.customerEmail,
          phone: data.customerPhone,
          firstName: nameParts[0],
          lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
        });

        // Generate unique event ID for deduplication
        const eventId = crypto.randomUUID();

        // GA4 Lead Event
        trackLead(
          selectedPackage,
          packageInfo.name,
          locale === 'tr' ? Math.round(packageInfo.price * rate) : packageInfo.price,
          locale === 'tr' ? 'TRY' : 'EUR',
          eventId,
        );

        // Track Booking Start Event
        trackBookingStart(selectedPackage);

        // Note: InitiateCheckout is handled exclusively by checkout-form.tsx to prevent duplication

        try {
          setIsNavigating(true);
          const draftResponse = await fetch("/api/booking/create-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...data,
              totalAmount: pricing?.totalPrice || basePrice,
              locale,
            }),
          });

          const draftResult = await draftResponse.json();
          const extraInfo = { isPerPerson, activeDiscount, packageDisplayName, packageDuration, packagePhotos, packageLocations, packageFeatures: packageFeatures || [] };
          const bookingDataToStore = draftResult.bookingId
            ? { ...data, ...extraInfo, totalAmount: pricing?.totalPrice || basePrice, basePrice, originalPrice: pricing?.originalPrice, bookingId: draftResult.bookingId }
            : { ...data, ...extraInfo, totalAmount: pricing?.totalPrice || basePrice, basePrice, originalPrice: pricing?.originalPrice };

          sessionStorage.setItem("bookingData", JSON.stringify(bookingDataToStore));

          form.reset();
          onClose();
          router.push(`/${locale}/checkout`);
        } catch (e) {
          console.error("Draft creation error:", e);
          sessionStorage.setItem("bookingData", JSON.stringify({
            ...data,
            packageDisplayName, packageDuration, packagePhotos, packageLocations, packageFeatures: packageFeatures || [],
            totalAmount: pricing?.totalPrice || basePrice,
            basePrice,
            originalPrice: pricing?.originalPrice
          }));
          form.reset();
          onClose();
          router.push(`/${locale}/checkout`);
        } finally {
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

  const FormContent = () => (
    <div className="max-w-5xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-none border border-border overflow-hidden rounded-lg">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t("customer_details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                        {t("form.name")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11 rounded-md bg-muted/50 border-input focus:bg-background transition-all"
                          placeholder={tplaceholders("enter_full_name")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                        {t("form.email")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-11 rounded-md bg-muted/50 border-input focus:bg-background transition-all"
                          type="email"
                          placeholder={tplaceholders("enter_email")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[11px]" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                      {t("form.phone")}
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        defaultCountry="TR"
                        placeholder={tplaceholders("phone_number")}
                        className="flex h-11 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-primary focus-within:bg-background focus-within:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium"
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-muted-foreground tracking-wide">
                      {t("form.notes")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={tplaceholders("special_requests")}
                        className="min-h-[100px] rounded-md bg-muted/50 border-input focus:bg-background transition-all resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Selected Information Summary */}
      <Card className="shadow-none border border-primary/20 bg-primary/5 overflow-hidden rounded-lg">
        <div className="px-6 py-4 bg-primary/10 border-b border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-md text-primary-foreground">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-primary truncate max-w-[180px] sm:max-w-none">
              {packageInfo.name}
            </span>
          </div>
          <Badge variant="outline" className="bg-background/50 border-primary/20 text-primary font-bold">
            {packageInfo.duration}
          </Badge>
        </div>
        <CardContent className="p-6 grid grid-cols-1 gap-6">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-background rounded-md border border-border shadow-sm">
              <CalendarIcon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{t("form.date")}</p>
              <p className="font-bold text-foreground text-sm">
                {form.getValues("bookingDate") ? format(new Date(form.getValues("bookingDate")), "PPP", { locale: dateFnsLocale }) : "---"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-background rounded-md border border-border shadow-sm">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{t("form.select_time")}</p>
              <p className="font-bold text-foreground text-sm">
                {form.getValues("bookingTime") || "---"}
              </p>
            </div>
          </div>

          {isPerPerson && (
            <div className="flex items-start gap-3">
              <div className="mt-1 p-2 bg-background rounded-md border border-border shadow-sm">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">{t("form.people_count")}</p>
                <p className="font-bold text-foreground text-sm">
                  {peopleCount} {peopleCount === 1 ? t("person") : t("people")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // isMobile is already declared above

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="bottom" className="h-[100dvh] w-screen p-0 flex flex-col rounded-none border-none inset-0">
          <SheetHeader className="p-6 border-b shrink-0">
            <div className="flex items-center gap-4">
              {step === "details" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ms-2 h-8 w-8"
                  onClick={() => setStep("selection")}
                >
                  <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                </Button>
              )}
              <SheetTitle className="text-xl font-bold">
                {step === "details" ? t("booking_details") : t("form.date_time")}
              </SheetTitle>
            </div>
            <SheetDescription className="hidden">
              {step === "details"
                ? t("modal_description")
                : t("form.select_booking_details")}{" "}
              <span className="font-semibold">{packageInfo.name}</span>
            </SheetDescription>
          </SheetHeader>

          <div className={cn("flex-1 overflow-y-auto", step === "selection" ? "p-0" : "p-6 pb-32")}>
            {step === "selection" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BookingCard
                  packageId={selectedPackage}
                  packageDisplayName={packageDisplayName}
                  basePrice={basePrice}
                  pricing={{
                    price: isPerPerson ? packageInfo.price / (peopleCount || 1) : packageInfo.price,
                    isDiscounted: packageInfo.isDiscounted,
                    discountPercentage: packageInfo.discountPercentage,
                    depositAmount: packageInfo.depositAmount,
                    remainingAmount: packageInfo.remainingAmount
                  }}
                  displayPrice={isPerPerson ? packageInfo.price / (peopleCount || 1) : packageInfo.price}
                  selectedDate={form.watch("bookingDate") ? new Date(form.watch("bookingDate")) : undefined}
                  setSelectedDate={(date) => form.setValue("bookingDate", date ? format(date, "yyyy-MM-dd") : "")}
                  selectedTime={form.watch("bookingTime")}
                  setSelectedTime={(time) => form.setValue("bookingTime", time || "")}
                  peopleCount={peopleCount}
                  setPeopleCount={setPeopleCount}
                  dateFnsLocale={dateFnsLocale}
                  tCheckout={t}
                  t={tPackages}
                  packageDuration={String(packageInfo.duration)}
                  isPerPerson={isPerPerson}
                  onCheckAvailability={() => setStep("details")}
                  isFlat={true}
                  activeDiscount={activeDiscount}
                  timeSurcharges={timeSurcharges}
                  isInsideModal={true}
                />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <FormContent />
              </div>
            )}
          </div>

          {step !== "selection" && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
              <div className="max-w-md mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-primary leading-none mt-0.5">
                    {formatPrice(packageInfo.depositAmount)}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground mt-1">
                    {t("labels.deposit_amount")} (30%)
                  </span>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 px-8 text-lg font-bold flex-1"
                  onClick={handleSubmit}
                  disabled={isNavigating || form.formState.isSubmitting}
                >
                  {isNavigating || form.formState.isSubmitting ? (
                    <Spinner className="h-5 w-5 animate-spin" />
                  ) : (
                    t("buttons.complete_booking")
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-xl w-full h-[92vh] md:h-[85vh] p-0 overflow-hidden flex flex-col gap-0 rounded-lg max-md:fixed max-md:inset-0 max-md:h-[100dvh] max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-none max-md:translate-x-0 max-md:translate-y-0"
        showCloseButton={true}
      >
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            {t("booking_details")}
          </DialogTitle>
          <DialogDescription className="hidden">
            {t("modal_description")}{" "}
            <span className="font-semibold text-foreground">
              {packageInfo.name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
          <FormContent />
        </div>

        <DialogFooter className="p-6 border-t bg-background shadow-[0_-4px_10px_rgba(0,0,0,0.03)] flex flex-row items-center justify-between sm:justify-between gap-4">
          <div className="flex flex-col text-start space-y-1">
            <span className="text-xl font-black text-primary leading-none">
              {t("labels.deposit_amount")} (30%) {formatPrice(packageInfo.depositAmount)}
            </span>
            <span className="text-[11px] text-muted-foreground font-bold">
              {t("labels.remaining_cash")} (70%) {formatPrice(packageInfo.remainingAmount)}
            </span>
          </div>

          <Button
            type="submit"
            className="h-12 px-10 text-md font-bold min-w-[200px]"
            onClick={handleSubmit}
            disabled={isNavigating || form.formState.isSubmitting}
          >
            {isNavigating || form.formState.isSubmitting ? (
              <Spinner className="h-5 w-5 animate-spin" />
            ) : (
              t("buttons.complete_booking")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
