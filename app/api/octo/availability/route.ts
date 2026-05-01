import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Availability, AvailabilityStatus } from "@octocloud/types";

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export async function POST(request: NextRequest) {
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { productId, optionId, localDateStart, localDateEnd } = body;

    if (!productId || !localDateStart || !localDateEnd) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing required fields (productId, localDateStart, localDateEnd)" },
        { status: 400 }
      );
    }

    // 1. Get package details (duration & base price)
    const { data: pkgData, error: pkgError } = await supabaseAdmin
      .from("packages")
      .select("id, slug, duration, price")
      .eq("id", productId)
      .single();

    if (pkgError || !pkgData) {
      return NextResponse.json({ error: "Not Found", message: "Product not found" }, { status: 404 });
    }

    const basePrice = pkgData.price || 0;

    // Parse duration
    const durStr = (pkgData.duration?.en || "").toLowerCase();
    let durationMins = 60;
    if (durStr.includes("hour")) {
      const h = parseFloat(durStr);
      if (!isNaN(h)) durationMins = h * 60;
    } else if (durStr.includes("min")) {
      const m = parseInt(durStr);
      if (!isNaN(m)) durationMins = m;
    }

    // 2. Fetch Settings
    const { data: settingsData } = await supabaseAdmin
      .from("availability_settings")
      .select("start_time, end_time")
      .eq("id", "default")
      .single();
      
    const startHour = settingsData?.start_time ? parseInt(settingsData.start_time.split(":")[0]) : 6;
    const endHour = settingsData?.end_time ? parseInt(settingsData.end_time.split(":")[0]) : 20;

    // 3. Generate Dates Array
    const dates: string[] = [];
    let currentDate = new Date(localDateStart);
    const endDate = new Date(localDateEnd);
    
    // Safety check to prevent infinite loops (max 31 days)
    let daysCount = 0;
    while (currentDate <= endDate && daysCount < 31) {
      dates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
      daysCount++;
    }

    // 4. Fetch all bookings for the date range
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: allBookings } = await supabaseAdmin
      .from("bookings")
      .select("booking_date, booking_time, package_id, status, created_at")
      .in("booking_date", dates)
      .neq("status", "cancelled")
      .neq("status", "failed");

    // Fetch all packages for dynamic overlapping durations
    const { data: allPackages } = await supabaseAdmin.from("packages").select("slug, duration, id");
    const dynamicDurations: Record<string, number> = {};
    if (allPackages) {
      for (const p of allPackages) {
        const dStr = (p.duration?.en || "").toLowerCase();
        let m = 60;
        if (dStr.includes("hour")) m = parseFloat(dStr) * 60 || 60;
        else if (dStr.includes("min")) m = parseInt(dStr) || 60;
        dynamicDurations[p.id] = m;
      }
    }

    // 5. Fetch all blocked slots for the date range
    const { data: allBlockedData } = await supabaseAdmin
      .from("blocked_slots")
      .select("date, time")
      .in("date", dates);

    // 5.b Fetch time surcharges for dynamic pricing
    const { data: surcharges } = await supabaseAdmin
      .from("time_surcharges")
      .select("time, surcharge_percentage");

    const availableSlots: Availability[] = [];

    // 6. Calculate Availability per Date
    for (const date of dates) {
      let isDayFullyBlocked = false;
      const manualBlockedSlots = new Set<string>();

      const dayBlockedData = (allBlockedData || []).filter((b: any) => b.date === date);
      for (const b of dayBlockedData) {
        if (!b.time) {
          isDayFullyBlocked = true;
          break;
        }
        manualBlockedSlots.add(b.time);
      }

      if (isDayFullyBlocked) continue;

      // Filter valid bookings for this date
      const validBookings = (allBookings || []).filter((b: any) => {
        if (b.booking_date !== date) return false;
        if (["pending", "confirmed", "completed"].includes(b.status)) return true;
        if (b.status === "draft") return new Date(b.created_at) >= new Date(tenMinsAgo);
        return false;
      });

      // Check every 30-min slot between startHour and endHour
      for (let h = startHour; h <= endHour; h++) {
        for (const m of ["00", "30"]) {
          const slot = `${h.toString().padStart(2, "0")}:${m}`;
          
          const requestedStart = timeToMinutes(slot);
          const requestedEnd = requestedStart + durationMins;

          if (manualBlockedSlots.has(slot)) continue;

          let isOverlapping = false;
          for (const b of validBookings) {
            if (!b.booking_time) continue;
            const existingStart = timeToMinutes(b.booking_time);
            const existingDuration = dynamicDurations[b.package_id as string] || 60;
            const existingEnd = existingStart + existingDuration;

            if (requestedStart < existingEnd && requestedEnd > existingStart) {
              isOverlapping = true;
              break;
            }
          }

          if (!isOverlapping) {
            // Found a valid, completely open slot! Map to OCTO Availability
            const startDateTime = `${date}T${slot}:00+03:00`; // Istanbul TZ
            const endH = Math.floor(requestedEnd / 60);
            const endM = requestedEnd % 60;
            const endDateTime = `${date}T${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}:00+03:00`;

            // Calculate UTC Cutoff (e.g. 24 hours before)
            const cutoffDate = new Date(new Date(startDateTime).getTime() - 24 * 60 * 60 * 1000);

            // Calculate Dynamic Pricing based on Time Surcharges
            let slotRetailPrice = basePrice;
            if (surcharges && surcharges.length > 0) {
              const exactMatch = surcharges.find((s: any) => s.time === slot);
              const genericMatch = surcharges.find((s: any) => s.time === slot.replace(":30", ":00"));
              const activeSurcharge = exactMatch || genericMatch;
              
              if (activeSurcharge) {
                slotRetailPrice = basePrice * (1 + activeSurcharge.surcharge_percentage / 100);
              }
            }

            const retailCents = Math.round(slotRetailPrice * 100);
            const netCents = Math.round(slotRetailPrice * 0.9 * 100); // 10% commission

            availableSlots.push({
              id: startDateTime,
              localDateTimeStart: startDateTime,
              localDateTimeEnd: endDateTime,
              allDay: false,
              status: AvailabilityStatus.AVAILABLE,
              vacancies: 1, // Assume 1 package slot per time
              capacity: 1,
              maxUnits: 10,
              utcCutoffAt: cutoffDate.toISOString(),
              available: true,
              openingHours: [],
              pricing: {
                original: retailCents,
                retail: retailCents,
                net: netCents,
                currency: "EUR",
                currencyPrecision: 2,
                includedTaxes: []
              }
            });
          }
        }
      }
    }

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error("OCTO API Error - Availability:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
