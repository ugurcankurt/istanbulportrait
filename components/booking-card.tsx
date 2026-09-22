"use client";
import { format } from "date-fns";
import {
  Banknote,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  Clock,
  MinusCircle,
  PlusCircle,
  Sun,
  Sunrise,
  Sunset,
  User2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/contexts/currency-context";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AddonDB } from "@/lib/addons-service";
import { trackSchedule } from "@/lib/analytics";
import type { TimeSurcharge } from "@/lib/availability-service";
import type { DiscountDB } from "@/lib/discount-service";
import { matchActiveSurcharge } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { PackageId } from "@/lib/validations";

interface BookingCardProps {
  packageId: PackageId;
  packageDisplayName: string;
  basePrice: number;
  pricing: {
    price: number;
    isDiscounted: boolean;
    discountPercentage: number;
    depositAmount: number;
    remainingAmount: number;
    originalPrice?: number;
  };
  displayPrice: number;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | undefined;
  setSelectedTime: (time: string | undefined) => void;
  peopleCount: number;
  setPeopleCount: (count: number) => void;
  dateFnsLocale: any;
  tCheckout: any;
  t: any;
  packageDuration: string;
  isPerPerson: boolean;
  onCheckAvailability: () => void;
  isFlat?: boolean;
  activeDiscounts?: DiscountDB[] | null;
  timeSurcharges?: TimeSurcharge[];
  isInsideModal?: boolean;
  whatsappNumber?: string;
  onYieldChange?: (multiplier: number, reason: string) => void;
  yieldReason?: string;
  availableAddons?: AddonDB[];
  selectedAddons?: string[];
  setSelectedAddons?: (addons: string[]) => void;
  addonQuantities?: Record<string, number>;
  setAddonQuantities?: (quantities: Record<string, number>) => void;
}

export function BookingCard({
  packageId,
  packageDisplayName,
  basePrice,
  pricing,
  displayPrice,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  peopleCount,
  setPeopleCount,
  dateFnsLocale,
  tCheckout,
  t,
  packageDuration,
  isPerPerson,
  onCheckAvailability,
  isFlat = false,
  activeDiscounts = null,
  timeSurcharges = [],
  isInsideModal = false,
  whatsappNumber,
  onYieldChange,
  yieldReason = "standard",
  availableAddons = [],
  selectedAddons = [],
  setSelectedAddons,
  addonQuantities = {},
  setAddonQuantities,
}: BookingCardProps) {
  const isMobile = useIsMobile();
  const { formatPrice, currency } = useCurrency();
  const tValidation = useTranslations("validation");
  const tui = useTranslations("ui");
  const [isPeoplePopoverOpen, setIsPeoplePopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const popoverZIndex = isInsideModal ? "z-[60]" : "z-20";

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [checkState, setCheckState] = useState<
    "idle" | "checking" | "success" | "ready"
  >("idle");
  const [checkingProgress, setCheckingProgress] = useState(0);

  // Reset state when selection changes
  useEffect(() => {
    if (checkState === "ready" || checkState === "success") {
      setCheckState("idle");
    }
  }, [checkState]);

  useEffect(() => {
    if (!selectedDate || !packageId) {
      setBookedSlots([]);
      return;
    }

    const fetchAvailability = async () => {
      setIsLoadingSlots(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(
          `/api/booking/availability?date=${formattedDate}&packageId=${packageId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setBookedSlots(data.blockedSlots || []);

          if (onYieldChange) {
            onYieldChange(
              data.dynamicMultiplier || 1.0,
              data.yieldReason || "standard",
            );
          }

          if (selectedTime && data.blockedSlots?.includes(selectedTime)) {
            setSelectedTime(undefined);
          }
        }
      } catch (error) {
        console.error("Availability error", error);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, packageId, setSelectedTime, selectedTime, onYieldChange]);

  const handleCheckAvailability = () => {
    if (!selectedDate || !selectedTime) {
      setShowValidation(true);

      // Haptic feedback for mobile devices
      if (
        typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.vibrate
      ) {
        window.navigator.vibrate(50);
      }

      if (!selectedDate) {
        toast.error(tValidation("date_required"));
        setIsDatePopoverOpen(true);
      } else if (!selectedTime) {
        toast.error(tValidation("time_required"));
        setIsTimePopoverOpen(true);
      }
      return;
    }

    setShowValidation(false);

    if (checkState !== "idle") return;
    setCheckState("checking");
    setCheckingProgress(0);

    const startTime = Date.now();
    const duration = 3000;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setCheckingProgress(progress);

      if (elapsed < duration) {
        requestAnimationFrame(tick);
      } else {
        // Progress complete — show success state briefly
        setCheckState("success");
        setCheckingProgress(100);

        // Track the schedule event when availability check succeeds
        if (selectedDate && selectedTime) {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          trackSchedule(
            packageId,
            packageDisplayName,
            `${formattedDate} ${selectedTime}`,
          );
        }

        setTimeout(() => {
          setCheckState("ready");
          setCheckingProgress(0);
        }, 900);
      }
    };

    requestAnimationFrame(tick);
  };

  const handleWhatsApp = () => {
    const formattedDate = selectedDate
      ? format(selectedDate, "PPP", { locale: dateFnsLocale })
      : "";
    const isTr = dateFnsLocale?.code?.startsWith("tr");
    const msg = isTr
      ? `Merhaba, ${packageDisplayName} paketi için ${formattedDate} tarihi ve ${selectedTime} saati uygun mu? Bilgi almak istiyorum.`
      : `Hi! I would like to inquire about the ${packageDisplayName} package on ${formattedDate} at ${selectedTime}. Is it available?`;

    const encoded = encodeURIComponent(msg);
    const number = (whatsappNumber || "905367093724").replace(/[^\d]/g, "");
    window.open(`https://wa.me/${number}?text=${encoded}`, "_blank");
  };

  const isDateDiscounted = (date: Date) => {
    if (!activeDiscounts || activeDiscounts.length === 0) return false;

    const checkTime = date.getTime();

    return activeDiscounts.some((discount) => {
      if (!discount.start_date || !discount.end_date) return false;
      const start = new Date(discount.start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(discount.end_date);
      end.setHours(23, 59, 59, 999);
      return checkTime >= start.getTime() && checkTime <= end.getTime();
    });
  };

  return (
    <Card
      className={cn(
        "overflow-hidden bg-card p-0 transition-all duration-700 relative",
        isFlat
          ? "border-none shadow-none"
          : "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] rounded-3xl border border-white/20 dark:border-white/10 bg-background/40 backdrop-blur-3xl",
      )}
    >
      <CardContent
        className={cn("space-y-4", isInsideModal ? "p-4 pt-2" : "p-6")}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isPerPerson && (
              <Badge className="bg-primary/10 text-primary border-primary/20 shadow-none font-bold uppercase tracking-widest text-[10px]">
                👤 {t("per_person")}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-muted-foreground lowercase">
                {t("starting_from")} /
              </span>
              <span
                className={cn(
                  "font-serif text-foreground leading-none",
                  isInsideModal ? "text-3xl" : "text-5xl",
                )}
              >
                {formatPrice(displayPrice)}
              </span>
              {pricing.isDiscounted && (
                <div className="flex items-center">
                  <span
                    className={cn(
                      "text-muted-foreground line-through font-medium leading-none ml-1",
                      isInsideModal ? "text-base" : "text-lg",
                    )}
                  >
                    {formatPrice(pricing.originalPrice || basePrice)}
                  </span>
                  {pricing.discountPercentage &&
                    pricing.discountPercentage > 0 && (
                      <Badge className="bg-red-600 backdrop-blur-md text-white border border-red-500 font-serif tracking-widest uppercase text-xs px-3 py-1 shadow-sm ml-2">
                        {tui("save_percentage", {
                          percentage: Math.round(
                            pricing.discountPercentage * 100,
                          ),
                        })}
                      </Badge>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Form Interface */}
        <div className="grid grid-cols-1 gap-4">
          {/* People Count Selector */}
          {isPerPerson && (
            <div className="space-y-2">
              <Popover
                open={isPeoplePopoverOpen}
                onOpenChange={setIsPeoplePopoverOpen}
                modal={false}
              >
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "w-full h-14 px-6 font-bold flex items-center justify-between",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <User2 className="h-5 w-5 text-primary stroke-[2.5]" />
                    <span>
                      {tCheckout("person")} x {peopleCount}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 opacity-50 transition-transform",
                      isPeoplePopoverOpen && "rotate-180",
                    )}
                  />
                </PopoverTrigger>
                <PopoverContent
                  className={cn("w-[var(--anchor-width)] p-4", popoverZIndex)}
                  positionerClassName={popoverZIndex}
                  collisionAvoidance={{ side: "none" }}
                  align="start"
                  side="bottom"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-foreground">
                          {tCheckout("person")}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md border-border text-primary hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30"
                          onClick={() =>
                            setPeopleCount(Math.max(1, peopleCount - 1))
                          }
                          disabled={peopleCount <= 1}
                        >
                          <MinusCircle className="h-6 w-6 stroke-[1.5]" />
                        </Button>
                        <span className="w-6 text-center text-lg font-bold text-foreground">
                          {peopleCount}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md border-border text-primary hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30"
                          onClick={() =>
                            setPeopleCount(Math.min(10, peopleCount + 1))
                          }
                          disabled={peopleCount >= 10}
                        >
                          <PlusCircle className="h-6 w-6 stroke-[1.5]" />
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <Button
                        className="w-full h-10 bg-primary text-primary-foreground font-bold"
                        onClick={() => setIsPeoplePopoverOpen(false)}
                      >
                        {tCheckout("buttons.continue")}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Date Selector */}
          <div className="space-y-2">
            <Popover
              open={isDatePopoverOpen}
              onOpenChange={setIsDatePopoverOpen}
              modal={false}
            >
              <PopoverTrigger
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full h-14 px-6 font-bold flex items-center justify-between transition-colors",
                  !selectedDate && "text-muted-foreground/60",
                  showValidation &&
                    !selectedDate &&
                    "border-2 border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
                )}
              >
                <div className="flex items-center gap-3 text-start">
                  <CalendarIcon className="h-5 w-5 text-primary stroke-[2.5]" />
                  <span>
                    {selectedDate
                      ? format(selectedDate, "PPP", { locale: dateFnsLocale })
                      : tCheckout("form.date")}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 opacity-50 transition-transform",
                    isDatePopoverOpen && "rotate-180",
                  )}
                />
              </PopoverTrigger>
              <PopoverContent
                className={cn(
                  "p-0",
                  isMobile ? "w-[95vw] max-w-[360px]" : "w-auto",
                  popoverZIndex,
                )}
                positionerClassName={popoverZIndex}
                collisionAvoidance={{ side: "none", align: "shift" }}
                align={isMobile ? "center" : "end"}
                side="bottom"
                sideOffset={8}
              >
                <Calendar
                  mode="single"
                  showOutsideDays={false}
                  className="w-full"
                  classNames={
                    isMobile
                      ? {
                          root: "w-full p-4 pt-8",
                          months: "w-full relative",
                          month: "w-full",
                          month_grid: "w-full border-collapse table-fixed mt-4",
                          day: "w-full p-0 flex items-center justify-center",
                          day_button: "w-full aspect-square",
                          nav: "absolute top-0 inset-x-0 flex justify-between px-2",
                        }
                      : {}
                  }
                  numberOfMonths={isMobile ? 1 : 2}
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsDatePopoverOpen(false);
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today || date < new Date("1900-01-01");
                  }}
                  modifiers={{ discount: isDateDiscounted }}
                  modifiersClassNames={{
                    discount:
                      "bg-primary/10 text-primary font-black border border-primary/20 rounded-md relative after:absolute after:top-1 after:right-1 after:content-['%'] after:text-[10px] after:font-black after:text-primary",
                  }}
                  initialFocus
                  locale={dateFnsLocale}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selector */}
          {selectedDate && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
              <Popover
                open={isTimePopoverOpen}
                onOpenChange={setIsTimePopoverOpen}
                modal={false}
              >
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "w-full h-14 px-6 font-bold flex items-center justify-between transition-colors",
                    !selectedTime && "text-muted-foreground/60",
                    showValidation &&
                      !selectedTime &&
                      "border-2 border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400",
                  )}
                >
                  <div className="flex items-center gap-3 text-start">
                    <Clock className="h-5 w-5 text-primary stroke-[2.5]" />
                    <span>
                      {selectedTime
                        ? selectedTime
                        : tCheckout("form.select_time")}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 opacity-50 transition-transform",
                      isTimePopoverOpen && "rotate-180",
                    )}
                  />
                </PopoverTrigger>
                <PopoverContent
                  className={cn("w-[var(--anchor-width)] p-3", popoverZIndex)}
                  positionerClassName={popoverZIndex}
                  collisionAvoidance={{ side: "none", align: "shift" }}
                  align={isMobile ? "center" : "start"}
                  side="bottom"
                >
                  <Tabs defaultValue="morning" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full h-12 p-1 bg-muted/50 rounded-lg mb-6">
                      <TabsTrigger
                        value="morning"
                        className="rounded-md text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-none shadow-none gap-2"
                      >
                        <Sunrise className="h-4 w-4" />
                        {tCheckout("form.morning")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="noon"
                        className="rounded-md text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-none shadow-none gap-2"
                      >
                        <Sun className="h-4 w-4" />
                        {tCheckout("form.noon")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="afternoon"
                        className="rounded-md text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-none shadow-none gap-2"
                      >
                        <Sunset className="h-4 w-4" />
                        {tCheckout("form.afternoon")}
                      </TabsTrigger>
                    </TabsList>

                    {["morning", "noon", "afternoon"].map((period) => {
                      const allSlots = [];
                      for (let h = 6; h <= 20; h++) {
                        allSlots.push(`${h.toString().padStart(2, "0")}:00`);
                        allSlots.push(`${h.toString().padStart(2, "0")}:30`);
                      }

                      const slots = allSlots.filter((t) => {
                        if (period === "morning") return t < "11:00";
                        if (period === "noon")
                          return t >= "11:00" && t < "15:00";
                        return t >= "15:00";
                      });

                      return (
                        <TabsContent
                          key={period}
                          value={period}
                          className="mt-0 outline-none"
                        >
                          <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {slots.map((time) => {
                              const isBlocked = bookedSlots.includes(time);
                              const activeSurcharge = matchActiveSurcharge(
                                time,
                                timeSurcharges,
                              );

                              return (
                                <Button
                                  key={time}
                                  variant={
                                    selectedTime === time
                                      ? "default"
                                      : "outline"
                                  }
                                  className={cn(
                                    "h-10 text-xs font-bold transition-all relative overflow-hidden",
                                    selectedTime === time && "shadow-sm",
                                    isBlocked &&
                                      "bg-red-500 text-white border-red-600 cursor-not-allowed hover:bg-red-500 hover:text-white disabled:opacity-90 shadow-sm",
                                  )}
                                  onClick={() => {
                                    if (!isBlocked) {
                                      setSelectedTime(time);
                                      setIsTimePopoverOpen(false);
                                    }
                                  }}
                                  disabled={isBlocked || isLoadingSlots}
                                >
                                  {isBlocked ? (
                                    dateFnsLocale?.code?.startsWith("tr") ? (
                                      "Dolu"
                                    ) : (
                                      "Reserved"
                                    )
                                  ) : (
                                    <span className="flex items-center gap-1.5">
                                      {time}
                                      {activeSurcharge && (
                                        <span className="text-[10px] text-amber-500 dark:text-amber-400 font-black tracking-tighter">
                                          (+%
                                          {activeSurcharge.surcharge_percentage}
                                          )
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Add-ons Selector */}
        {availableAddons && availableAddons.length > 0 && setSelectedAddons && (
          <div className="space-y-3 pt-4 border-t border-border/50">
            <h4 className="text-sm font-bold text-foreground">
              {tCheckout("form.addons") || "Add-ons"}
            </h4>
            <div className="space-y-2">
              {availableAddons.map((addon) => {
                const addonPrice = Number(addon.price);
                const isSelected = selectedAddons.includes(addon.id);
                const qty = addonQuantities[addon.id] || 1;
                const displayAddonPrice = addon.is_per_person
                  ? addonPrice * qty
                  : addonPrice;

                return (
                  <div
                    key={addon.id}
                    className="flex flex-col space-y-2 rounded-md border p-3 shadow-sm bg-background"
                  >
                    <div className="flex flex-row items-start space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const newSelected = checked
                            ? [...selectedAddons, addon.id]
                            : selectedAddons.filter((id) => id !== addon.id);
                          setSelectedAddons(newSelected);

                          // If checking a per-person addon, ensure it has a default quantity (1)
                          if (
                            checked &&
                            addon.is_per_person &&
                            setAddonQuantities
                          ) {
                            setAddonQuantities({
                              ...addonQuantities,
                              [addon.id]: 1,
                            });
                          }
                        }}
                        id={`addon-${addon.id}`}
                      />
                      <div className="flex-1 space-y-1 leading-none">
                        <label
                          htmlFor={`addon-${addon.id}`}
                          className="text-sm font-bold leading-none cursor-pointer"
                        >
                          {addon.title?.[
                            dateFnsLocale?.code?.split("-")[0] || "en"
                          ] || addon.title?.en}
                        </label>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {addon.description?.[
                            dateFnsLocale?.code?.split("-")[0] || "en"
                          ] || addon.description?.en}
                        </p>
                      </div>
                      <div className="font-bold text-sm text-primary whitespace-nowrap">
                        +{formatPrice(displayAddonPrice)}
                      </div>
                    </div>

                    {addon.is_per_person && isSelected && (
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/50 pl-7">
                        <span className="text-xs font-medium text-muted-foreground">
                          {tCheckout("person")}
                        </span>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-md border-border text-primary hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30"
                            onClick={(e) => {
                              e.preventDefault();
                              if (setAddonQuantities) {
                                setAddonQuantities({
                                  ...addonQuantities,
                                  [addon.id]: Math.max(1, qty - 1),
                                });
                              }
                            }}
                            disabled={qty <= 1}
                          >
                            <MinusCircle className="h-3 w-3 stroke-[2]" />
                          </Button>
                          <span className="w-3 text-center text-xs font-bold text-foreground">
                            {qty}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-md border-border text-primary hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30"
                            onClick={(e) => {
                              e.preventDefault();
                              if (setAddonQuantities) {
                                setAddonQuantities({
                                  ...addonQuantities,
                                  [addon.id]: Math.min(peopleCount, qty + 1),
                                });
                              }
                            }}
                            disabled={qty >= peopleCount}
                          >
                            <PlusCircle className="h-3 w-3 stroke-[2]" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Check Availability — 3 states: idle / checking / success */}
        {checkState === "checking" && (
          <div className="w-full h-11 rounded-md border border-primary/30 bg-primary/5 flex items-center justify-between px-4 overflow-hidden relative">
            {/* Animated progress fill */}
            <div
              className="absolute inset-0 bg-primary/10"
              style={{ width: `${checkingProgress}%` }}
            />
            <div className="flex items-center gap-2 z-10">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-primary">
                {tCheckout("buttons.checking_availability") ||
                  "Checking Availability..."}
              </span>
            </div>
            <span className="text-xs font-bold text-primary/60 z-10">
              {Math.round(checkingProgress)}%
            </span>
          </div>
        )}

        {checkState === "success" && (
          <div className="w-full h-11 rounded-md border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-300">
            {/* Animated checkmark ring */}
            <div className="relative flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30 animate-in zoom-in-50 duration-300">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              {/* Ripple */}
              <div className="absolute w-6 h-6 rounded-full border-2 border-emerald-400 animate-ping opacity-60" />
            </div>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {tCheckout("buttons.availability_confirmed") ||
                "Spot Available! Opening..."}
            </span>
          </div>
        )}

        {checkState === "idle" && (
          <Button
            variant="default"
            size="lg"
            className="w-full h-11 font-black shadow-lg transition-transform active:scale-[0.98]"
            onClick={handleCheckAvailability}
          >
            {tCheckout("buttons.check_availability")}
          </Button>
        )}

        {checkState === "ready" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Button
              variant="secondary"
              className="w-full h-12 font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40 transition-colors"
              onClick={handleWhatsApp}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                className="w-5 h-5 mr-2 fill-current"
              >
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 411.9c-31.5 0-62.5-8.4-89.6-24.5l-6.4-3.8-66.5 17.4 17.7-64.8-4.2-6.7c-17.7-28-27.1-60-27.1-92.4 0-97 79-176 176.1-176 47.1 0 91.4 18.4 124.7 51.7s51.7 77.6 51.7 124.7c0 97-79 176-176.1 176zM320.6 288.5c-5.3-2.7-31.3-15.5-36.2-17.2-4.9-1.7-8.4-2.7-12 2.7-3.6 5.3-13.8 17.2-16.9 20.7-3.1 3.6-6.2 4-11.5 1.3-5.3-2.7-22.4-8.3-42.6-26.3-15.7-14-26.3-31.3-29.4-36.6-3.1-5.3-.3-8.2 2.4-10.8 2.4-2.4 5.3-6.2 8-9.3 2.7-3.1 3.6-5.3 5.3-8.9 1.7-3.6 .9-6.7-.4-9.3-1.3-2.7-12-28.9-16.4-39.6-4.3-10.5-8.7-9.1-12-9.3-3.1-.2-6.7-.2-10.2-.2-3.6 0-9.3 1.3-14.2 6.7-4.9 5.3-18.6 18.2-18.6 44.4s19.1 51.5 21.8 55.1c2.7 3.6 37.6 57.4 91.1 80.5 12.7 5.5 22.6 8.7 30.4 11.2 12.7 4 24.3 3.4 33.4 2.1 10.2-1.5 31.3-12.8 35.7-25.2 4.4-12.4 4.4-23.1 3.1-25.2-1.3-2.1-4.9-3.4-10.2-6.1z" />
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="default"
              className="w-full h-12 font-bold shadow-lg transition-transform active:scale-[0.98]"
              onClick={onCheckAvailability}
            >
              {tCheckout("buttons.continue")}
            </Button>
          </div>
        )}

        {/* Total Price Summary for Per Person Packages */}
        {isPerPerson && peopleCount > 0 && (
          <div className="flex items-center justify-between p-3 mt-2 bg-primary/5 rounded-lg border border-primary/10">
            <span className="text-sm font-medium text-foreground">
              {t("total_price") || "Total Price"} ({peopleCount} 👤)
            </span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(displayPrice * peopleCount)}
            </span>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-start gap-3 group">
            <div className="mt-1">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {tCheckout("cancellation.title")}
              </p>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                {tCheckout("cancellation.description")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 group">
            <div className="mt-1">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {tCheckout("payment_methods.cash")}
              </p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  {tCheckout("payment_methods.cash_description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
