import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const PACKAGE_DURATIONS: Record<string, number> = {
  essential: 30,
  premium: 90,
  luxury: 150,
  rooftop: 60, // base 1 hour
};

function timeToMinutes(timeStr: string): number {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return Number.NaN;
  const [h, m] = timeStr.split(":").map(Number);
  if (
    !Number.isFinite(h) ||
    !Number.isFinite(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return Number.NaN;
  }
  return h * 60 + m;
}

function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function getIstanbulNow(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value || "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = Number.parseInt(get("hour"), 10) % 24;
  const minute = Number.parseInt(get("minute"), 10);
  return { date, minutes: hour * 60 + minute };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const packageId = searchParams.get("packageId");

  if (!date || !packageId) {
    return NextResponse.json(
      { error: "date and packageId are required", blockedSlots: [] },
      { status: 400 },
    );
  }

  if (!isValidIsoDate(date)) {
    return NextResponse.json(
      { error: "Invalid date format", blockedSlots: [] },
      { status: 400 },
    );
  }

  // Fetch settings bounds (start_time, end_time)
  const { data: settingsData } = await supabaseAdmin
    .from("availability_settings")
    .select("start_time, end_time")
    .eq("id", "default")
    .single();

  const parsedStart = settingsData?.start_time
    ? timeToMinutes(settingsData.start_time)
    : 6 * 60;
  const parsedEnd = settingsData?.end_time
    ? timeToMinutes(settingsData.end_time)
    : 20 * 60;
  const startMinutes = Number.isFinite(parsedStart) ? parsedStart : 6 * 60;
  const endMinutes = Number.isFinite(parsedEnd) ? parsedEnd : 20 * 60;

  // Fetch active packages to get exact durations dynamically
  const { data: allPackages, error: packagesError } = await supabaseAdmin
    .from("packages")
    .select("slug, duration, is_active");

  if (packagesError) {
    return NextResponse.json(
      { error: "Failed to load packages" },
      { status: 500 },
    );
  }

  const dynamicDurations: Record<string, number> = { ...PACKAGE_DURATIONS };
  const validSlugs = new Set<string>(Object.keys(PACKAGE_DURATIONS));

  if (allPackages && allPackages.length > 0) {
    validSlugs.clear();
    for (const p of allPackages) {
      if (p.is_active === false) continue;
      validSlugs.add(p.slug);
      const durStr = (p.duration?.en || "").toLowerCase();
      let mins = 0;
      const hourMatch = durStr.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h\b)/i);
      const minMatch = durStr.match(/(\d+)\s*(?:min|m\b)/i);
      if (hourMatch) {
        mins += Math.round(parseFloat(hourMatch[1]) * 60);
      }
      if (minMatch) {
        mins += parseInt(minMatch[1], 10);
      }
      if (mins <= 0) {
        mins = PACKAGE_DURATIONS[p.slug] || 60;
      }
      dynamicDurations[p.slug] = mins;
    }
  }

  if (!validSlugs.has(packageId)) {
    return NextResponse.json(
      { error: "Unknown or inactive package", blockedSlots: [] },
      { status: 400 },
    );
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

  if (error) {
    return NextResponse.json(
      { error: "Failed to load availability" },
      { status: 500 },
    );
  }

  // Fetch manually blocked slots
  const { data: blockedData, error: blockedError } = await supabaseAdmin
    .from("blocked_slots")
    .select("time")
    .eq("date", date);

  if (blockedError) {
    return NextResponse.json(
      { error: "Failed to load blocked slots" },
      { status: 500 },
    );
  }

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

  // Generate 30-min slots covering configured bounds and UI grid (06:00 - 20:30)
  const minHour = Math.min(6, Math.floor(startMinutes / 60));
  const maxHour = Math.max(20, Math.floor(endMinutes / 60));
  const allSlots: string[] = [];
  for (let h = minHour; h <= maxHour; h++) {
    allSlots.push(`${h.toString().padStart(2, "0")}:00`);
    allSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  const istanbulNow = getIstanbulNow();
  if (isDayFullyBlocked || date < istanbulNow.date) {
    return NextResponse.json(
      { blockedSlots: allSlots },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Filter valid bookings that actually block time
  const validBookings = (data || []).filter((b: any) => {
    if (["pending", "confirmed", "completed"].includes(b.status)) return true;
    if (b.status === "draft")
      return new Date(b.created_at) >= new Date(tenMinsAgo);
    return false;
  });

  const blockedSlots: string[] = [];
  const manualBlockedMinutes = Array.from(manualBlockedSlots)
    .map(timeToMinutes)
    .filter((m) => Number.isFinite(m));

  for (const slot of allSlots) {
    const requestedStart = timeToMinutes(slot);
    const requestedEnd = requestedStart + requestedDuration;

    // Block past slots on the current Istanbul date
    if (date === istanbulNow.date && requestedStart <= istanbulNow.minutes) {
      blockedSlots.push(slot);
      continue;
    }

    // Block if session falls outside configured working hours
    if (requestedStart < startMinutes || requestedEnd > endMinutes) {
      blockedSlots.push(slot);
      continue;
    }

    // Block if any manually blocked 30-min slot overlaps the requested session window
    const overlapsManualBlock = manualBlockedMinutes.some(
      (blockedStart) =>
        requestedStart < blockedStart + 30 && requestedEnd > blockedStart,
    );
    if (overlapsManualBlock) {
      blockedSlots.push(slot);
      continue;
    }

    // Check overlap with any existing booking
    let isOverlapping = false;
    for (const b of validBookings) {
      if (!b.booking_time) continue;

      const existingStart = timeToMinutes(b.booking_time);
      if (!Number.isFinite(existingStart)) continue;
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

  // YIELD MANAGEMENT CALCULATION
  const dynamicMultiplier = 1.0;
  const yieldReason = "standard";

  return NextResponse.json(
    { blockedSlots, dynamicMultiplier, yieldReason },
    { headers: { "Cache-Control": "no-store" } },
  );
}
