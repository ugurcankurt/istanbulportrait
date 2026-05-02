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
  // 1. Authenticate
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  const { uuid } = await params;

  try {
    // 2. Fetch existing booking by uuid (in our system, we used uuid as notes or could search it)
    // For this implementation, we assume `uuid` is stored in a column or we are searching by it.
    // Let's assume the OTA passed `uuid` and we need to confirm it.
    
    // NOTE: In a real production DB, you should add a `uuid` column to the `bookings` table.
    // For now, we simulate finding the booking and updating it.
    
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

    let body: any = {};
    try {
      body = await request.json();
    } catch(e) {}

    let finalUuid = booking.octo_uuid || booking.id;
    let currentUnitItems: any[] = [];
    let cleanNotes = booking.notes || "";
    
    if (booking.octo_data && booking.octo_data.unitItems) {
      currentUnitItems = booking.octo_data.unitItems;
    } else if (booking.notes && booking.notes.includes("---OCTO_META---")) {
      cleanNotes = booking.notes.split("\n---OCTO_META---")[0];
      try {
        const metaStr = booking.notes.split("---OCTO_META---\n")[1];
        const meta = JSON.parse(metaStr);
        if (meta.unitItems && Array.isArray(meta.unitItems)) currentUnitItems = meta.unitItems;
        if (meta.uuid) finalUuid = meta.uuid;
      } catch (e) {}
    }

    // Process confirm updates if contact provided
    const updates: any = { status: "confirmed" };
    if (body.contact) {
      if (body.contact.fullName) updates.user_name = body.contact.fullName;
      if (body.contact.emailAddress) updates.user_email = body.contact.emailAddress;
      if (body.contact.phoneNumber) updates.user_phone = body.contact.phoneNumber;
      if (body.contact.locales && body.contact.locales.length > 0) updates.locale = body.contact.locales[0];
    }
    if (body.resellerReference) {
      cleanNotes = (cleanNotes ? cleanNotes + " | " : "") + `Reseller Ref: ${body.resellerReference}`;
    }
    
    if (body.unitItems && Array.isArray(body.unitItems)) {
      // Validate unit IDs
      for (const item of body.unitItems) {
        if (item.unitId && item.unitId !== `unit_${booking.package_id}_adult`) {
          return NextResponse.json(
            { error: "INVALID_UNIT_ID", errorMessage: "Unit ID not found or invalid", unitId: item.unitId },
            { status: 400 }
          );
        }
      }
      updates.people_count = body.unitItems.length;
      currentUnitItems = body.unitItems;
    }

    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const headers = Object.fromEntries(request.headers);
    const newMeta = { 
      ...(booking.octo_data || {}),
      uuid: finalUuid, 
      unitItems: currentUnitItems,
      contact: {
        ...(booking.octo_data?.contact || {}),
        ...(body.contact || {})
      },
      RAW_CONFIRM_BODY: body,
      RAW_CONFIRM_QUERY: searchParams,
      RAW_CONFIRM_HEADERS: headers
    };
    if (body.resellerReference !== undefined) {
      newMeta.resellerReference = body.resellerReference;
    }
    updates.octo_uuid = finalUuid;
    updates.octo_data = newMeta;
    updates.notes = cleanNotes;

    await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", booking.id);

    const updatedB = { ...booking, ...updates };
    // 3. Construct response
    const octoBooking = mapBookingToOcto(updatedB, finalUuid);

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Confirm Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
