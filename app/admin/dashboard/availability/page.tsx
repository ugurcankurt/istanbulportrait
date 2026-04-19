"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, ShieldAlert, PercentCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { availabilityService, type AvailabilitySettings, type BlockedSlot, type TimeSurcharge } from "@/lib/availability-service";

const TIME_OPTIONS = Array.from({ length: 17 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6;
  const isHalfHour = i % 2 !== 0;
  return `${hour.toString().padStart(2, "0")}:${isHalfHour ? "30" : "00"}`;
});

export default function AvailabilityPage() {
  const [settings, setSettings] = useState<AvailabilitySettings>({ id: "default", start_time: "06:00", end_time: "20:00" });
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [surcharges, setSurcharges] = useState<TimeSurcharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState<Date | undefined>(undefined);
  const [newBlockTime, setNewBlockTime] = useState<string>("all");
  const [newBlockReason, setNewBlockReason] = useState("");

  const [newSurchargeTime, setNewSurchargeTime] = useState<string>(TIME_OPTIONS[0]);
  const [newSurchargePercent, setNewSurchargePercent] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedSettings, fetchedBlocked, fetchedSurcharges] = await Promise.all([
        availabilityService.getSettings(),
        availabilityService.getBlockedSlots(),
        availabilityService.getTimeSurcharges()
      ]);
      setSettings(fetchedSettings);
      setBlockedSlots(fetchedBlocked);
      setSurcharges(fetchedSurcharges);
    } catch (e) {
      toast.error("Failed to load availability data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await availabilityService.updateSettings(settings.start_time, settings.end_time);
      toast.success("Working hours updated successfully");
    } catch (e) {
      toast.error("Failed to save working hours");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddBlock = async () => {
    if (!newBlockDate) {
      toast.error("Please select a date");
      return;
    }
    
    setIsSaving(true);
    try {
      const formattedDate = format(newBlockDate, "yyyy-MM-dd");
      const timeToSave = newBlockTime === "all" ? null : newBlockTime;
      await availabilityService.addBlockedSlot(formattedDate, timeToSave, newBlockReason || null);
      
      toast.success("Slot blocked successfully!");
      setIsAddModalOpen(false);
      setNewBlockDate(undefined);
      setNewBlockTime("all");
      setNewBlockReason("");
      
      await fetchData();
    } catch (e) {
      toast.error("Failed to add blocked slot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await availabilityService.deleteBlockedSlot(id);
      toast.success("Block removed");
      setBlockedSlots(slots => slots.filter(s => s.id !== id));
    } catch (e) {
      toast.error("Failed to remove block");
    }
  };

  const handleAddSurcharge = async () => {
    const p = parseFloat(newSurchargePercent);
    if (!newSurchargeTime || isNaN(p) || p <= 0) {
       toast.error("Please provide a valid time and increasing percentage.");
       return;
    }
    setIsSaving(true);
    try {
       await availabilityService.addTimeSurcharge(newSurchargeTime, p);
       toast.success("Surcharge created!");
       setNewSurchargePercent("");
       await fetchData();
    } catch (e: any) {
       toast.error(e?.message?.includes("unique") ? "This time slot already has a surcharge." : "Failed to add surcharge.");
    } finally {
       setIsSaving(false);
    }
  };

  const handleDeleteSurcharge = async (id: string) => {
    try {
      await availabilityService.deleteTimeSurcharge(id);
      toast.success("Surcharge removed");
      setSurcharges(s => s.filter(x => x.id !== id));
    } catch (e) {
      toast.error("Failed to remove surcharge");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading availability settings...</div>;
  }

  return (
    <div className="space-y-8 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Availability & Calendar</h1>
        <p className="text-muted-foreground mb-6 max-w-3xl">Manage global working hours and block specific dates or times from being booked. Use this tool to lock out holidays or specific periods.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Settings Panel */}
        <Card className="lg:col-span-5 xl:col-span-4 shadow-sm border-border">
          <CardHeader className="bg-muted/20 pb-5 border-b">
            <CardTitle className="text-lg">Global Working Hours</CardTitle>
            <CardDescription className="pt-1">Set the earliest and latest time generally available for booking.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Start Time</Label>
                <Select value={settings.start_time} onValueChange={(val) => setSettings({ ...settings, start_time: val || "" })}>
                  <SelectTrigger className="font-bold h-11 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">End Time</Label>
                <Select value={settings.end_time} onValueChange={(val) => setSettings({ ...settings, end_time: val || "" })}>
                  <SelectTrigger className="font-bold h-11 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full h-11 font-bold shadow-sm">
              {isSaving ? "Saving..." : "Save Hours"}
            </Button>
          </CardContent>
        </Card>

        {/* Golden Hour / Time Surcharges Panel */}
        <Card className="lg:col-span-5 xl:col-span-4 shadow-sm border-border">
          <CardHeader className="bg-amber-500/5 pb-5 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" /> Dynamic Pricing
            </CardTitle>
            <CardDescription className="pt-1">Add percentage markups to busy hours (e.g., Golden Hour). Base prices will be dynamically increased.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-3 items-end">
              <div className="space-y-2 flex-1">
                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Time</Label>
                <Select value={newSurchargeTime} onValueChange={(val) => setNewSurchargeTime(val || "")}>
                  <SelectTrigger className="font-bold h-11 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px]">
                    {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1 relative">
                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Markup +%</Label>
                <Input placeholder="e.g. 20" type="number" min="1" max="100" className="pr-8 h-11 font-bold" value={newSurchargePercent} onChange={e => setNewSurchargePercent(e.target.value)} />
                <PercentCircle className="w-4 h-4 absolute right-3 top-9 text-muted-foreground" />
              </div>
            </div>
            <Button onClick={handleAddSurcharge} disabled={isSaving || !newSurchargePercent} className="w-full h-11 font-bold shadow-sm bg-amber-500 hover:bg-amber-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Surcharge Rate
            </Button>
            
            {surcharges.length > 0 && (
              <div className="mt-4 border rounded-md divide-y">
                {surcharges.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-muted/20">
                     <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-bold border-amber-200 text-amber-600 bg-amber-50">{s.time}</Badge>
                        <span className="text-sm font-bold text-emerald-600">+{s.surcharge_percentage}% Price</span>
                     </div>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSurcharge(s.id)}>
                        <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Blocks Table Panel */}
        <Card className="lg:col-span-7 xl:col-span-8 shadow-sm border-border overflow-hidden lg:row-span-2">
          <CardHeader className="bg-muted/20 pb-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Blocked Dates & Slots</CardTitle>
              <CardDescription className="pt-1">Dates and times manually disabled for booking.</CardDescription>
            </div>
            <Button className="gap-2 shadow-sm font-bold shrink-0" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4" /> Add Block
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Block a Time Slot</DialogTitle>
                  <DialogDescription>Select a date and time. Leave time as "All Day" to fully block the entire date.</DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">Date</Label>
                      <Popover>
                        <PopoverTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-left font-normal bg-background", !newBlockDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newBlockDate ? format(newBlockDate, "yyyy-MM-dd") : <span>Pick a date</span>}
                          </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={newBlockDate} onSelect={setNewBlockDate} initialFocus disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">Time</Label>
                      <Select value={newBlockTime} onValueChange={(val) => setNewBlockTime(val || "")}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="all" className="font-bold text-rose-500">All Day (Fully Blocked)</SelectItem>
                          {TIME_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-muted-foreground">Reason (Optional)</Label>
                    <Input className="bg-background" placeholder="e.g. Holiday, Maintenance, Private Event" value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddBlock} disabled={isSaving || !newBlockDate}>Save Block</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="w-[200px] pl-6">Date</TableHead>
                    <TableHead className="w-[150px]">Time</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedSlots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2 my-8">
                          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                             <CalendarIcon className="w-5 h-5 text-muted-foreground/60" />
                          </div>
                          <p className="font-medium text-foreground">No blocked slots currently</p>
                          <p className="text-sm">Your schedule is completely open based on your working hours.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    blockedSlots.map((slot) => (
                      <TableRow key={slot.id} className="group hover:bg-muted/5">
                        <TableCell className="font-medium whitespace-nowrap pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-background border rounded-md shadow-sm">
                               <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            {format(new Date(slot.date), "MMM do, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          {slot.time ? (
                            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                              <Clock className="w-4 h-4 text-primary" />
                              {slot.time}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              Entire Day
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {slot.reason ? (
                            <span className="text-sm">{slot.reason}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground/50 italic">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDeleteBlock(slot.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
