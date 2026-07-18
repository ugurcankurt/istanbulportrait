import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BookingStatus } from "@octocloud/types";
import { mapBookingToOcto } from "@/lib/octo-mapper";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  const { uuid } = await params;

  if (!uuid) {
    return NextResponse.json(
      { error: "INVALID_BOOKING_UUID", errorMessage: "The booking UUID was invalid or missing", uuid: "" },
      { status: 400 }
    );
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch(e) {}

    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .or(`id.eq.${uuid},octo_uuid.eq.${uuid}`)
      .limit(1);

    const b = bookings?.[0];

    if (fetchError || !b) {
      return NextResponse.json(
        { error: "INVALID_BOOKING_UUID", errorMessage: "Booking not found", uuid: uuid },
        { status: 400 }
      );
    }

    const reason = body.reason || "Cancelled by API Request";

    // Update status to CANCELLED in DB and save cancellation reason to octo_data
    const updatedOctoData = { ...(b.octo_data || {}), cancellationReason: reason };
    await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled", octo_data: updatedOctoData })
      .eq("id", b.id);

    b.status = "cancelled";
    b.octo_data = updatedOctoData;

    const octoBooking = mapBookingToOcto(b, uuid);

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Cancel Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", errorMessage: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
