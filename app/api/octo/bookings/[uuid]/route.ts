import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Booking, BookingStatus, DeliveryMethod } from "@octocloud/types";

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
    const { data: b, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", uuid)
      .single();

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
    let finalUuid = uuid;
    
    if (b.notes && b.notes.includes("---OCTO_META---")) {
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

    const octoBooking: Booking = {
      id: b.id,
      uuid: finalUuid,
      testMode: false,
      resellerReference: null,
      supplierReference: b.id,
      status: status,
      utcCreatedAt: b.created_at || new Date().toISOString(),
      utcUpdatedAt: b.created_at || new Date().toISOString(),
      utcExpiresAt: status === BookingStatus.ON_HOLD ? new Date(new Date(b.created_at).getTime() + 60 * 60 * 1000).toISOString() : null,
      utcRedeemedAt: null,
      utcConfirmedAt: status === BookingStatus.CONFIRMED ? b.created_at : null,
      productId: b.package_id || "unknown",
      optionId: `opt_${b.package_id || "unknown"}`,
      cancellable: true,
      cancellation: status === BookingStatus.CANCELLED ? {
        refund: "FULL" as any,
        reason: "Cancelled",
        utcCancelledAt: new Date().toISOString()
      } : null,
      freesale: false,
      availabilityId: b.booking_date && b.booking_time ? `${b.booking_date}T${b.booking_time}:00+03:00` : null,
      availability: null,
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
      notes: b.notes ? b.notes.split("\n---OCTO_META---")[0] : null,
      deliveryMethods: [DeliveryMethod.VOUCHER],
      voucher: null,
      unitItems: unitItems
    };

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

    const { data: b, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", uuid)
      .single();

    if (fetchError || !b) {
      return NextResponse.json(
        { error: "INVALID_BOOKING_UUID", errorMessage: "Booking not found", uuid: uuid },
        { status: 400 }
      );
    }

    // Process update
    let finalUuid = b.id;
    let currentUnitItems: any[] = [];
    let cleanNotes = b.notes || "";
    
    if (b.notes && b.notes.includes("---OCTO_META---")) {
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

    // Always re-save meta
    const newMeta = { uuid: finalUuid, unitItems: currentUnitItems };
    updates.notes = `${cleanNotes}\n---OCTO_META---\n${JSON.stringify(newMeta)}`;

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

    const octoBooking: Booking = {
      id: updatedB.id,
      uuid: finalUuid,
      testMode: false,
      resellerReference: body.resellerReference || null,
      supplierReference: updatedB.id,
      status: status,
      utcCreatedAt: updatedB.created_at || new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: status === BookingStatus.ON_HOLD ? new Date(new Date(updatedB.created_at).getTime() + (body.expirationMinutes || 60) * 60 * 1000).toISOString() : null,
      utcRedeemedAt: null,
      utcConfirmedAt: status === BookingStatus.CONFIRMED ? updatedB.created_at : null,
      productId: updatedB.package_id || "unknown",
      optionId: body.optionId || `opt_${updatedB.package_id || "unknown"}`,
      cancellable: true,
      cancellation: status === BookingStatus.CANCELLED ? {
        refund: "FULL" as any,
        reason: "Cancelled",
        utcCancelledAt: new Date().toISOString()
      } : null,
      freesale: false,
      availabilityId: body.availabilityId || (updatedB.booking_date && updatedB.booking_time ? `${updatedB.booking_date}T${updatedB.booking_time}:00+03:00` : null),
      availability: null,
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
      notes: cleanNotes,
      deliveryMethods: [DeliveryMethod.VOUCHER],
      voucher: null,
      unitItems: unitItems
    };

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Patch Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", errorMessage: "Failed to update booking" },
      { status: 500 }
    );
  }
}
