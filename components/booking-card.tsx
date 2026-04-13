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
  CreditCard,
} from "lucide-react";
import { DEPOSIT_PERCENTAGE } from "@/lib/pricing";
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

interface BookingCardProps {
  packageId: PackageId;
  basePrice: number;
  pricing: {
    price: number;
    isDiscounted: boolean;
    discountPercentage: number;
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
}

export function BookingCard({
  packageId,
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
}: BookingCardProps) {
  const isMobile = useIsMobile();
  const [isPeoplePopoverOpen, setIsPeoplePopoverOpen] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false);

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [checkState, setCheckState] = useState<"idle" | "checking" | "success">("idle");
  const [checkingProgress, setCheckingProgress] = useState(0);

  useEffect(() => {
    if (!selectedDate || !packageId) {
      setBookedSlots([]);
      return;
    }

    // The user requested to allow all time slots to be booked at any time, 
    // effectively disabling the slot blocking mechanic.
    setBookedSlots([]);
  }, [selectedDate, packageId, selectedTime, setSelectedTime]);

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
        setTimeout(() => {
          setCheckState("idle");
          setCheckingProgress(0);
          onCheckAvailability();
        }, 900);
      }
    };

    requestAnimationFrame(tick);
  };

  return (
    <Card className={cn(
      "overflow-hidden bg-card p-0",
      isFlat ? "border-none shadow-none" : "shadow-none border border-border"
    )}>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground leading-none">
              €{displayPrice}
            </span>
            {pricing.isDiscounted && (
              <span className="text-lg text-muted-foreground line-through font-medium leading-none">
                €{basePrice}
              </span>
            )}
            <span className="text-sm text-primary font-bold text-muted-foreground">
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
                  className={cn(buttonVariants({ variant: "outline" }), "w-full h-12 px-6 font-bold flex items-center justify-between")}
                >
                  <div className="flex items-center gap-3">
                    <User2 className="h-5 w-5 text-primary stroke-[2.5]" />
                    <span>{tCheckout("person")} x {peopleCount}</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isPeoplePopoverOpen && "rotate-180")} />
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-4 border-border shadow-2xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 duration-300 ease-in-out"
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
                  buttonVariants({ variant: "outline" }),
                  "w-full h-12 px-6 font-bold flex items-center justify-between",
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
                  "p-0 border-border shadow-2xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 duration-300 ease-in-out",
                  isMobile ? "w-[95vw] max-w-[360px]" : "w-auto"
                )}
                align="center"
                side="bottom"
                sideOffset={8}
              >
                <Calendar
                  mode="single"
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
                    buttonVariants({ variant: "outline" }),
                    "w-full h-12 px-6 font-bold flex items-center justify-between",
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
                  className="w-[var(--radix-popover-trigger-width)] p-3 border-border shadow-2xl transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4 duration-300 ease-in-out"
                  align="start"
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
                              return (
                                <Button
                                  key={time}
                                  variant={selectedTime === time ? "default" : "outline"}
                                  className={cn(
                                    "h-10 text-xs font-bold",
                                    selectedTime === time && "shadow-sm",
                                    isBlocked && "opacity-40 line-through cursor-not-allowed bg-muted"
                                  )}
                                  onClick={() => !isBlocked && setSelectedTime(time)}
                                  disabled={isBlocked || isLoadingSlots}
                                >
                                  {time}
                                </Button>
                              );
                            })}
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                  <div className="pt-2 border-t border-border/50 mt-0">
                    <Button
                      className="w-full h-10 bg-primary text-primary-foreground font-bold"
                      onClick={() => setIsTimePopoverOpen(false)}
                      disabled={!selectedTime}
                    >
                      {tCheckout("buttons.continue")}
                    </Button>
                  </div>
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

        <div className="space-y-4 pt-4 border-t border-border">          <div className="flex items-start gap-3 group">
            <div className="mt-1">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Secure Booking</p>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                  {`Pay the full amount (€${displayPrice}) in cash on photoshoot day.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
