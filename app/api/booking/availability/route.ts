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

  // Find duration of the requested package
  const requestedDuration = PACKAGE_DURATIONS[packageId] || 60;

  // Drafts hold for 10 minutes -> created_at >= NOW() - 10 minutes
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  // Fetch all bookings for the requested date 
  // Select all bookings that are not cancelled or failed.
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("booking_time, package_id, status, created_at")
    .eq("booking_date", date)
    .neq("status", "cancelled")
    .neq("status", "failed");

  if (error || !data) {
    return NextResponse.json({ blockedSlots: [] });
  }

  // Filter valid bookings that actually block time
  const validBookings = data.filter((b) => {
    if (["pending", "confirmed", "completed"].includes(b.status)) return true;
    if (b.status === "draft") {
      // Drafts only block if they are within the 10-minute window
      return new Date(b.created_at) >= new Date(tenMinsAgo);
    }
    return false;
  });

  // Generate all possible 30-min slots from 06:00 to 20:00 (what the UI shows)
  const allSlots: string[] = [];
  for (let h = 6; h <= 20; h++) {
    allSlots.push(`${h.toString().padStart(2, "0")}:00`);
    allSlots.push(`${h.toString().padStart(2, "0")}:30`);
  }

  const blockedSlots: string[] = [];

  for (const slot of allSlots) {
    const requestedStart = timeToMinutes(slot);
    const requestedEnd = requestedStart + requestedDuration; // exclusive end

    // Check overlap with any existing booking
    let isOverlapping = false;
    for (const b of validBookings) {
      if (!b.booking_time) continue;

      const existingStart = timeToMinutes(b.booking_time);
      const existingDuration = PACKAGE_DURATIONS[b.package_id as string] || 60;
      const existingEnd = existingStart + existingDuration;

      // True Overlap Condition: One starts before the other ends
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
