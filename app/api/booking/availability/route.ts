import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const PACKAGE_DURATIONS: Record<string, number> = {
  essential: 30,
  premium: 90,
  luxury: 150,
  rooftop: 60, // base 1 hour
};

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const packageId = searchParams.get("packageId");

  if (!date || !packageId) {
    return NextResponse.json({ blockedSlots: [] });
  }

  // Fetch settings bounds (start_time, end_time)
  const { data: settingsData } = await supabaseAdmin
    .from("availability_settings")
    .select("start_time, end_time")
    .eq("id", "default")
    .single();
    
  const startHour = settingsData?.start_time ? parseInt(settingsData.start_time.split(":")[0]) : 6;
  const endHour = settingsData?.end_time ? parseInt(settingsData.end_time.split(":")[0]) : 20;

  // Fetch all packages to get exact durations dynamically
  const { data: allPackages } = await supabaseAdmin.from("packages").select("slug, duration");
  
  const dynamicDurations: Record<string, number> = { ...PACKAGE_DURATIONS };
  
  if (allPackages) {
    for (const p of allPackages) {
       const durStr = (p.duration?.en || "").toLowerCase();
       let mins = 60;
       if (durStr.includes("hour")) {
         const h = parseFloat(durStr);
         if (!isNaN(h)) mins = h * 60;
       } else if (durStr.includes("min")) {
         const m = parseInt(durStr);
         if (!isNaN(m)) mins = m;
       }
       dynamicDurations[p.slug] = mins;
    }
  }

  // Find duration of the requested package
  const requestedDuration = dynamicDurations[packageId] || 60;

  // Drafts hold for 10 minutes -> created_at >= NOW() - 10 minutes
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  // Fetch all bookings for the requested date 
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("booking_time, package_id, status, created_at")
    .eq("booking_date", date)
    .neq("status", "cancelled")
    .neq("status", "failed");

  // Fetch manually blocked slots
  const { data: blockedData } = await supabaseAdmin
    .from("blocked_slots")
    .select("time")
    .eq("date", date);

  let isDayFullyBlocked = false;
  const manualBlockedSlots = new Set<string>();

  if (blockedData && blockedData.length > 0) {
    for (const b of blockedData) {
      if (!b.time) {
        isDayFullyBlocked = true;
        break;
      }
      manualBlockedSlots.add(b.time);
    }
  }

  // Generate all possible 30-min slots
  const allSlots: string[] = [];
  for (let h = 6; h <= 20; h++) { // For UI consistency we always return the static grid range, but block out of bounds
    allSlots.push(`${h.toString().padStart(2, "0")}:00`);
    allSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  if (isDayFullyBlocked) {
    return NextResponse.json({ blockedSlots: allSlots });
  }

  // Filter valid bookings that actually block time
  const validBookings = (data || []).filter((b: any) => {
    if (["pending", "confirmed", "completed"].includes(b.status)) return true;
    if (b.status === "draft") return new Date(b.created_at) >= new Date(tenMinsAgo);
    return false;
  });

  const blockedSlots: string[] = [];

  for (const slot of allSlots) {
    const requestedStart = timeToMinutes(slot);
    const requestedEnd = requestedStart + requestedDuration;
    
    // Block if outside working hours
    const h = parseInt(slot.split(":")[0]);
    if (h < startHour || h > endHour) {
       blockedSlots.push(slot);
       continue;
    }

    // Block if manually blocked
    if (manualBlockedSlots.has(slot)) {
       blockedSlots.push(slot);
       continue;
    }

    // Check overlap with any existing booking
    let isOverlapping = false;
    for (const b of validBookings) {
      if (!b.booking_time) continue;

      const existingStart = timeToMinutes(b.booking_time);
      const existingDuration = dynamicDurations[b.package_id as string] || 60;
      const existingEnd = existingStart + existingDuration;

      // True Overlap Condition
      if (requestedStart < existingEnd && requestedEnd > existingStart) {
        isOverlapping = true;
        break;
      }
    }

    if (isOverlapping) {
      blockedSlots.push(slot);
    }
  }

  return NextResponse.json({ blockedSlots });
}
