import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Booking, BookingStatus, DeliveryMethod } from "@octocloud/types";

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

    const reason = body.reason || "Cancelled by API Request";

    // Update status to CANCELLED
    await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", b.id);

    const status = BookingStatus.CANCELLED;

    let unitItems: any[] = [];
    let finalUuid = b.id;
    
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
      unitItems = unitItems.map(item => ({ ...item, status: status }));
    }

    const octoBooking: Booking = {
      id: b.id,
      uuid: finalUuid,
      testMode: false,
      resellerReference: null,
      supplierReference: b.id,
      status: status,
      utcCreatedAt: b.created_at || new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: null,
      utcRedeemedAt: null,
      utcConfirmedAt: b.status === "confirmed" ? b.created_at : null,
      productId: b.package_id || "unknown",
      optionId: `opt_${b.package_id || "unknown"}`,
      cancellable: false,
      cancellation: {
        refund: "FULL" as any,
        reason: reason,
        utcCancelledAt: new Date().toISOString()
      },
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
    console.error("OCTO API Error - Cancel Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", errorMessage: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
