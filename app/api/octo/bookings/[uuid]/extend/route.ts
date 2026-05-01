import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BookingStatus } from "@octocloud/types";
import { mapBookingToOcto } from "@/lib/octo-mapper";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  // 1. Authenticate
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  const { uuid } = await params;

  try {
    if (!uuid) {
      return NextResponse.json(
        { error: "INVALID_BOOKING_UUID", errorMessage: "The booking UUID was invalid or missing", uuid: "" },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body might be empty
    }

    // Default to 30 minutes if not provided
    const expirationMinutes = typeof body.expirationMinutes === "number" ? body.expirationMinutes : 30;

    // 2. Fetch existing booking by uuid (might be in id or inside notes as OCTO_META)
    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .or(`id.eq.${uuid},octo_uuid.eq.${uuid}`)
      .limit(1);

    const booking = bookings?.[0];

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "INVALID_BOOKING_UUID", errorMessage: "The booking UUID was invalid or missing", uuid: uuid || "" },
        { status: 400 }
      );
    }

    // 3. Extend expiration logic
    // We add expirationMinutes to the CURRENT expiresAt time in octo_data
    let currentExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    if (booking.octo_data && booking.octo_data.expiresAt) {
      currentExpiresAt = booking.octo_data.expiresAt;
    }

    const newExpiresAt = new Date(new Date(currentExpiresAt).getTime() + expirationMinutes * 60 * 1000).toISOString();
    
    // Save new expiration back to DB
    const updatedOctoData = { ...(booking.octo_data || {}), expiresAt: newExpiresAt };
    await supabaseAdmin
      .from("bookings")
      .update({ octo_data: updatedOctoData })
      .eq("id", booking.id);
      
    // Refetch or update object in memory to return correctly
    booking.octo_data = updatedOctoData;

    const octoBooking = mapBookingToOcto(booking, uuid);

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Extend Booking:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", errorMessage: "Failed to extend booking" },
      { status: 500 }
    );
  }
}
