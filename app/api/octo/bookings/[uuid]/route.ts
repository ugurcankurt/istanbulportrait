import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { BookingStatus } from "@octocloud/types";
import { mapBookingToOcto } from "@/lib/octo-mapper";

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

    let status = BookingStatus.ON_HOLD;
    if (b.status === "confirmed" || b.status === "completed") status = BookingStatus.CONFIRMED;
    if (b.status === "cancelled" || b.status === "failed") status = BookingStatus.CANCELLED;

    let unitItems: any[] = [];
    let finalUuid = b.octo_uuid || uuid;
    
    if (b.octo_data && b.octo_data.unitItems) {
      unitItems = b.octo_data.unitItems;
    } else if (b.notes && b.notes.includes("---OCTO_META---")) {
      try {
        const metaStr = b.notes.split("---OCTO_META---\n")[1];
        const meta = JSON.parse(metaStr);
        if (meta.unitItems && Array.isArray(meta.unitItems)) unitItems = meta.unitItems;
        if (meta.uuid) finalUuid = meta.uuid;
      } catch (e) {}
    }

    if (unitItems.length === 0) {
      const count = b.people_count || 1;
      unitItems = Array.from({ length: count }).map((_, i) => ({
        uuid: `${b.id.substring(0, 8)}-unit-${i}`,
        unitId: `unit_${b.package_id}_adult`,
        resellerReference: null,
        supplierReference: null,
        status: status,
        utcRedeemedAt: null,
        contact: {
          fullName: b.user_name || "Unknown",
          firstName: null,
          lastName: null,
          emailAddress: b.user_email || null,
          phoneNumber: b.user_phone || null,
          locales: b.locale ? [b.locale] : ["en"],
          country: null,
          notes: null,
          postalCode: null
        },
        ticket: null
      }));
    } else {
      unitItems = unitItems.map(item => ({ ...item, status }));
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

    // Save metadata properly
    const newMeta = { uuid: finalUuid, unitItems: currentUnitItems };
    updates.octo_uuid = finalUuid;
    updates.octo_data = newMeta;
    updates.notes = cleanNotes;

    await supabaseAdmin.from("bookings").update(updates).eq("id", b.id);

    // Re-fetch or simulate updated object
    const updatedB = { ...b, ...updates };

    let status = BookingStatus.ON_HOLD;
    if (updatedB.status === "confirmed" || updatedB.status === "completed") status = BookingStatus.CONFIRMED;
    if (updatedB.status === "cancelled" || updatedB.status === "failed") status = BookingStatus.CANCELLED;

    let unitItems = currentUnitItems;
    if (unitItems.length === 0) {
      const count = updatedB.people_count || 1;
      unitItems = Array.from({ length: count }).map((_, i) => ({
        uuid: `${updatedB.id.substring(0, 8)}-unit-${i}`,
        unitId: `unit_${updatedB.package_id}_adult`,
        resellerReference: null,
        supplierReference: null,
        status: status,
        utcRedeemedAt: null,
        contact: {
          fullName: updatedB.user_name || "Unknown",
          firstName: null,
          lastName: null,
          emailAddress: updatedB.user_email || null,
          phoneNumber: updatedB.user_phone || null,
          locales: updatedB.locale ? [updatedB.locale] : ["en"],
          country: null,
          notes: null,
          postalCode: null
        },
        ticket: null
      }));
    } else {
      unitItems = unitItems.map(item => ({ ...item, status }));
    }

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
