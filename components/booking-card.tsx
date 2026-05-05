"use client"
import {
  Clock,
  ChevronDown,
  Calendar as CalendarIcon,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  User2,
  Sunrise,
  Sun,
  Sunset,
  CreditCard
} from "lucide-react";
import { trackSchedule } from "@/lib/analytics";
import { DEPOSIT_PERCENTAGE, matchActiveSurcharge } from "@/lib/pricing";
import { useCurrency } from "@/contexts/currency-context";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { type PackageId } from "@/lib/validations";
import { type DiscountDB } from "@/lib/discount-service";
import type { TimeSurcharge } from "@/lib/availability-service";

interface BookingCardProps {
  packageId: PackageId;
  packageDisplayName: string;
  basePrice: number;
  pricing: {
    price: number;
    isDiscounted: boolean;
    discountPercentage: number;
    depositAmount?: number;
    remainingAmount?: number;
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
  activeDiscount?: DiscountDB | null;
  timeSurcharges?: TimeSurcharge[];
  isInsideModal?: boolean;
  whatsappNumber?: string;
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
  activeDiscount = null,
  timeSurcharges = [],
  isInsideModal = false,
  whatsappNumber,
}: BookingCardProps) {
  const isMobile = useIsMobile();
  const { formatPrice } = useCurrency();
  const [isPeoplePopoverOpen, setIsPeoplePopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false);

  const popoverZIndex = isInsideModal ? "z-[60]" : "z-20";

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [checkState, setCheckState] = useState<"idle" | "checking" | "success" | "ready">("idle");
  const [checkingProgress, setCheckingProgress] = useState(0);

  // Reset state when selection changes
  useEffect(() => {
    if (checkState === "ready" || checkState === "success") {
      setCheckState("idle");
    }
  }, [selectedDate, selectedTime, peopleCount]);

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
          `/api/booking/availability?date=${formattedDate}&packageId=${packageId}`
        );
        if (res.ok) {
          const data = await res.json();
          setBookedSlots(data.blockedSlots || []);

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
  }, [selectedDate, packageId]);

  const handleCheckAvailability = () => {
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
            `${formattedDate} ${selectedTime}`
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
    const formattedDate = selectedDate ? format(selectedDate, "PPP", { locale: dateFnsLocale }) : "";
    const isTr = dateFnsLocale?.code?.startsWith("tr");
    const msg = isTr 
      ? `Merhaba, ${packageDisplayName} paketi için ${formattedDate} tarihi ve ${selectedTime} saati uygun mu? Bilgi almak istiyorum.`
      : `Hi! I would like to inquire about the ${packageDisplayName} package on ${formattedDate} at ${selectedTime}. Is it available?`;
    
    const encoded = encodeURIComponent(msg);
    const number = (whatsappNumber || "905367093724").replace(/[^\d]/g, "");
    window.open(`https://wa.me/${number}?text=${encoded}`, "_blank");
  };

  const isDateDiscounted = (date: Date) => {
    if (!activeDiscount || !activeDiscount.start_date || !activeDiscount.end_date) return false;
    const start = new Date(activeDiscount.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(activeDiscount.end_date);
    end.setHours(23, 59, 59, 999);
    const checkTime = date.getTime();
    return checkTime >= start.getTime() && checkTime <= end.getTime();
  };

  return (
    <Card className={cn(
      "overflow-hidden bg-card p-0 transition-all duration-700",
      isFlat ? "border-none shadow-none" : "shadow-luxury rounded-3xl border-[0.5px] border-border/50 bg-background/50 backdrop-blur-sm"
    )}>
      <CardContent className={cn("space-y-4", isInsideModal ? "p-4 pt-2" : "p-6")}>
        <div className="space-y-4">
          <div className="flex items-baseline gap-1">
            <span className={cn("font-serif text-foreground leading-none", isInsideModal ? "text-3xl" : "text-5xl")}>
              {formatPrice(displayPrice)}
            </span>
            {pricing.isDiscounted && (
              <span className={cn("text-muted-foreground line-through font-medium leading-none", isInsideModal ? "text-base" : "text-lg")}>
                {formatPrice(basePrice)}
              </span>
            )}
            <span className="text-sm font-bold text-muted-foreground">
              {isPerPerson ? `/ ${t("per_person")}` : `/ ${packageDuration}`}
            </span>
          </div>
        </div>

        {/* Booking Form Interface */}
        <div className="grid grid-cols-1 gap-4">
          {/* People Count Selector */}
          {isPerPerson && (
            <div className="space-y-2">
              <Popover open={isPeoplePopoverOpen} onOpenChange={setIsPeoplePopoverOpen} modal={false}>
                <PopoverTrigger
                  className={cn(buttonVariants({ variant: "secondary" }), "w-full h-14 px-6 font-bold flex items-center justify-between")}
                >
                  <div className="flex items-center gap-3">
                    <User2 className="h-5 w-5 text-primary stroke-[2.5]" />
                    <span>{tCheckout("person")} x {peopleCount}</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isPeoplePopoverOpen && "rotate-180")} />
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
                        <p className="font-bold text-foreground">{tCheckout("person")}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md border-border text-primary hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30"
                          onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                          disabled={peopleCount <= 1}
                        >
                          <MinusCircle className="h-6 w-6 stroke-[1.5]" />
                        </Button>
                        <span className="w-6 text-center text-lg font-bold text-foreground">{peopleCount}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md border-border text-primary hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30"
                          onClick={() => setPeopleCount(Math.min(10, peopleCount + 1))}
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
            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen} modal={false}>
              <PopoverTrigger
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "w-full h-14 px-6 font-bold flex items-center justify-between",
                  !selectedDate && "text-muted-foreground/60"
                )}
              >
                <div className="flex items-center gap-3 text-start">
                  <CalendarIcon className="h-5 w-5 text-primary stroke-[2.5]" />
                  <span>{selectedDate ? format(selectedDate, "PPP", { locale: dateFnsLocale }) : tCheckout("form.date")}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isDatePopoverOpen && "rotate-180")} />
              </PopoverTrigger>
              <PopoverContent
                className={cn(
                  "p-0",
                  isMobile ? "w-[95vw] max-w-[360px]" : "w-auto",
                  popoverZIndex
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
                  classNames={isMobile ? {
                    root: "w-full p-4 pt-8",
                    months: "w-full relative",
                    month: "w-full",
                    month_grid: "w-full border-collapse table-fixed mt-4",
                    day: "w-full p-0 flex items-center justify-center",
                    day_button: "w-full aspect-square",
                    nav: "absolute top-0 inset-x-0 flex justify-between px-2",
                  } : {}}
                  numberOfMonths={isMobile ? 1 : 2}
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsDatePopoverOpen(false);
                  }}
                  disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                  modifiers={{ discount: isDateDiscounted }}
                  modifiersClassNames={{ discount: "bg-primary/10 text-primary font-black border border-primary/20 rounded-md relative after:absolute after:top-1 after:right-1 after:content-['%'] after:text-[10px] after:font-black after:text-primary" }}
                  initialFocus
                  locale={dateFnsLocale}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selector */}
          {selectedDate && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
              <Popover open={isTimePopoverOpen} onOpenChange={setIsTimePopoverOpen} modal={false}>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "w-full h-14 px-6 font-bold flex items-center justify-between",
                    !selectedTime && "text-muted-foreground/60"
                  )}
                >
                  <div className="flex items-center gap-3 text-start">
                    <Clock className="h-5 w-5 text-primary stroke-[2.5]" />
                    <span>{selectedTime ? selectedTime : tCheckout("form.select_time")}</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isTimePopoverOpen && "rotate-180")} />
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
                      <TabsTrigger value="morning" className="rounded-md text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-none shadow-none gap-2">
                        <Sunrise className="h-4 w-4" />
                        {tCheckout("form.morning")}
                      </TabsTrigger>
                      <TabsTrigger value="noon" className="rounded-md text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-none shadow-none gap-2">
                        <Sun className="h-4 w-4" />
                        {tCheckout("form.noon")}
                      </TabsTrigger>
                      <TabsTrigger value="afternoon" className="rounded-md text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border-none shadow-none gap-2">
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

                      const slots = allSlots.filter(t => {
                        if (period === "morning") return t < "11:00";
                        if (period === "noon") return t >= "11:00" && t < "15:00";
                        return t >= "15:00";
                      });

                      return (
                        <TabsContent key={period} value={period} className="mt-0 outline-none">
                          <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                            {slots.map((time) => {
                              const isBlocked = bookedSlots.includes(time);
                              const activeSurcharge = matchActiveSurcharge(time, timeSurcharges);

                              return (
                                <Button
                                  key={time}
                                  variant={selectedTime === time ? "default" : "outline"}
                                  className={cn(
                                    "h-10 text-xs font-bold transition-all relative overflow-hidden",
                                    selectedTime === time && "shadow-sm",
                                    isBlocked && "bg-red-500 text-white border-red-600 cursor-not-allowed hover:bg-red-500 hover:text-white disabled:opacity-90 shadow-sm"
                                  )}
                                  onClick={() => {
                                    if (!isBlocked) {
                                      setSelectedTime(time);
                                      setIsTimePopoverOpen(false);
                                    }
                                  }}
                                  disabled={isBlocked || isLoadingSlots}
                                >
                                  {isBlocked ? (dateFnsLocale?.code?.startsWith("tr") ? "Dolu" : "Reserved") : (
                                    <span className="flex items-center gap-1.5">
                                      {time}
                                      {activeSurcharge && (
                                        <span className="text-[10px] text-amber-500 dark:text-amber-400 font-black tracking-tighter">
                                          (+%{activeSurcharge.surcharge_percentage})
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
                {tCheckout("buttons.checking_availability") || "Checking Availability..."}
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
              {tCheckout("buttons.availability_confirmed") || "Spot Available! Opening..."}
            </span>
          </div>
        )}

        {checkState === "idle" && (
          <Button
            variant="default"
            size="lg"
            className="w-full h-11 font-black"
            onClick={handleCheckAvailability}
            disabled={!selectedDate || !selectedTime}
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-5 h-5 mr-2 fill-current"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 411.9c-31.5 0-62.5-8.4-89.6-24.5l-6.4-3.8-66.5 17.4 17.7-64.8-4.2-6.7c-17.7-28-27.1-60-27.1-92.4 0-97 79-176 176.1-176 47.1 0 91.4 18.4 124.7 51.7s51.7 77.6 51.7 124.7c0 97-79 176-176.1 176zM320.6 288.5c-5.3-2.7-31.3-15.5-36.2-17.2-4.9-1.7-8.4-2.7-12 2.7-3.6 5.3-13.8 17.2-16.9 20.7-3.1 3.6-6.2 4-11.5 1.3-5.3-2.7-22.4-8.3-42.6-26.3-15.7-14-26.3-31.3-29.4-36.6-3.1-5.3-.3-8.2 2.4-10.8 2.4-2.4 5.3-6.2 8-9.3 2.7-3.1 3.6-5.3 5.3-8.9 1.7-3.6 .9-6.7-.4-9.3-1.3-2.7-12-28.9-16.4-39.6-4.3-10.5-8.7-9.1-12-9.3-3.1-.2-6.7-.2-10.2-.2-3.6 0-9.3 1.3-14.2 6.7-4.9 5.3-18.6 18.2-18.6 44.4s19.1 51.5 21.8 55.1c2.7 3.6 37.6 57.4 91.1 80.5 12.7 5.5 22.6 8.7 30.4 11.2 12.7 4 24.3 3.4 33.4 2.1 10.2-1.5 31.3-12.8 35.7-25.2 4.4-12.4 4.4-23.1 3.1-25.2-1.3-2.1-4.9-3.4-10.2-6.1z"/></svg>
              WhatsApp
            </Button>
            <Button
              variant="default"
              className="w-full h-12 font-bold shadow-sm"
              onClick={onCheckAvailability}
            >
              {tCheckout("buttons.continue")}
            </Button>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-start gap-3 group">
            <div className="mt-1">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{tCheckout("cancellation.title")}</p>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">{tCheckout("cancellation.description")}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 group">
            <div className="mt-1">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{tCheckout("security.secure_payment")}</p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  {tCheckout("payment_breakdown.pay_now", { amount: `${formatPrice(pricing.depositAmount ?? Math.round(displayPrice * DEPOSIT_PERCENTAGE))}` })} {tCheckout("payment_breakdown.pay_on_day", { amount: `${formatPrice(pricing.remainingAmount ?? (displayPrice - Math.round(displayPrice * DEPOSIT_PERCENTAGE)))}` })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
