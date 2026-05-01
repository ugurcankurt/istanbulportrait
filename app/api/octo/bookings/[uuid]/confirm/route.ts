import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Booking, BookingStatus, DeliveryMethod } from "@octocloud/types";

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
    
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", uuid) // Matching by ID for simplicity if OTA sent ID as UUID
      .single();

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

    // Process confirm updates if contact provided
    const updates: any = { status: "confirmed" };
    if (body.contact) {
      if (body.contact.fullName) updates.user_name = body.contact.fullName;
      if (body.contact.emailAddress) updates.user_email = body.contact.emailAddress;
      if (body.contact.phoneNumber) updates.user_phone = body.contact.phoneNumber;
      if (body.contact.locales && body.contact.locales.length > 0) updates.locale = body.contact.locales[0];
    }
    if (body.resellerReference) {
      updates.notes = (booking.notes ? booking.notes + " | " : "") + `Reseller Ref: ${body.resellerReference}`;
    }

    await supabaseAdmin
      .from("bookings")
      .update(updates)
      .eq("id", booking.id);

    const updatedB = { ...booking, ...updates };
    const status = BookingStatus.CONFIRMED;

    const count = updatedB.people_count || 1;
    const unitItems = Array.from({ length: count }).map((_, i) => ({
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

    // 3. Construct response
    const octoBooking: Booking = {
      id: updatedB.id,
      uuid: updatedB.id,
      testMode: false,
      resellerReference: body.resellerReference || null,
      supplierReference: updatedB.id,
      status: status,
      utcCreatedAt: updatedB.created_at || new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: null,
      utcRedeemedAt: null,
      utcConfirmedAt: updatedB.created_at || new Date().toISOString(),
      productId: updatedB.package_id || "unknown",
      optionId: "standard",
      cancellable: true,
      cancellation: null,
      freesale: false,
      availabilityId: updatedB.booking_date && updatedB.booking_time ? `${updatedB.booking_date}T${updatedB.booking_time}:00+03:00` : null,
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
      notes: updatedB.notes || null,
      deliveryMethods: [DeliveryMethod.VOUCHER],
      voucher: null,
      unitItems: unitItems
    };

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Confirm Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
