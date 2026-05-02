import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BookingStatus } from "@octocloud/types";
import { mapBookingToOcto } from "@/lib/octo-mapper";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET(
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



    const octoBooking = mapBookingToOcto(b, uuid);

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Get Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", errorMessage: "Failed to get booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const rawText = await request.text();
    // HTTP LOGGING
    await supabaseAdmin.from("bookings").insert({
      package_id: "LOG_HTTP",
      status: "cancelled",
      total_amount: 0,
      user_name: "LOG_PATCH",
      user_email: "log@log.com",
      user_phone: "0000000000",
      booking_date: "2026-01-01",
      notes: JSON.stringify({
        method: "PATCH",
        url: request.url,
        body: rawText,
        headers: Object.fromEntries(request.headers)
      })
    });
    
    let body: any = {};
    try {
      body = JSON.parse(rawText || "{}");
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

    // Process update
    let finalUuid = b.octo_uuid || b.id;
    let currentUnitItems: any[] = [];
    let cleanNotes = b.notes || "";
    
    if (b.octo_data && b.octo_data.unitItems) {
      currentUnitItems = b.octo_data.unitItems;
    } else if (b.notes && b.notes.includes("---OCTO_META---")) {
      cleanNotes = b.notes.split("\n---OCTO_META---")[0];
      try {
        const metaStr = b.notes.split("---OCTO_META---\n")[1];
        const meta = JSON.parse(metaStr);
        if (meta.unitItems && Array.isArray(meta.unitItems)) currentUnitItems = meta.unitItems;
        if (meta.uuid) finalUuid = meta.uuid;
      } catch (e) {}
    }

    const updates: any = {};
    if (body.notes !== undefined) cleanNotes = body.notes;
    
    if (body.contact) {
      if (body.contact.fullName) updates.user_name = body.contact.fullName;
      if (body.contact.emailAddress) updates.user_email = body.contact.emailAddress;
      if (body.contact.phoneNumber) updates.user_phone = body.contact.phoneNumber;
      if (body.contact.locales && body.contact.locales.length > 0) updates.locale = body.contact.locales[0];
    }
    
    if (body.unitItems && Array.isArray(body.unitItems)) {
      updates.people_count = body.unitItems.length;
      currentUnitItems = body.unitItems;
    }

    const searchParams = Object.fromEntries(new URL(request.url).searchParams);
    const headers = Object.fromEntries(request.headers);
    // Save metadata properly
    const newMeta = { 
      ...(b.octo_data || {}),
      uuid: finalUuid, 
      unitItems: currentUnitItems,
      contact: {
        ...(b.octo_data?.contact || {}),
        ...(body.contact || {})
      },
      RAW_PATCH_BODY: body,
      RAW_PATCH_QUERY: searchParams,
      RAW_PATCH_HEADERS: headers
    };
    if (body.resellerReference !== undefined) {
      newMeta.resellerReference = body.resellerReference;
    }
    
    updates.octo_uuid = finalUuid;
    updates.octo_data = newMeta;
    updates.notes = cleanNotes;

    await supabaseAdmin.from("bookings").update(updates).eq("id", b.id);

    // Re-fetch or simulate updated object
    const updatedB = { ...b, ...updates };



    const octoBooking = mapBookingToOcto(updatedB, finalUuid);

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Patch Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", errorMessage: "Failed to update booking" },
      { status: 500 }
    );
  }
}
