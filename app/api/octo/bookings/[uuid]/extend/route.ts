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

    // 2. Fetch existing booking by uuid
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", uuid)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: "INVALID_BOOKING_UUID", errorMessage: "The booking UUID was invalid or missing", uuid: uuid || "" },
        { status: 400 }
      );
    }

    // 3. Extend expiration logic
    const newExpiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();
    
    let octoStatus = BookingStatus.ON_HOLD;
    if (booking.status === "confirmed" || booking.status === "completed") {
      octoStatus = BookingStatus.CONFIRMED;
    } else if (booking.status === "cancelled" || booking.status === "failed") {
      octoStatus = BookingStatus.CANCELLED;
    }

    // 4. Construct response
    const octoBooking: Booking = {
      id: booking.id,
      uuid: uuid,
      testMode: false,
      resellerReference: "RES-" + uuid.substring(0, 5),
      supplierReference: booking.id,
      status: octoStatus,
      utcCreatedAt: booking.created_at || new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: octoStatus === BookingStatus.ON_HOLD ? newExpiresAt : null,
      utcRedeemedAt: null,
      utcConfirmedAt: octoStatus === BookingStatus.CONFIRMED ? (booking.created_at || new Date().toISOString()) : null,
      productId: booking.package_id || "unknown",
      optionId: "standard",
      cancellable: true,
      cancellation: null,
      freesale: false,
      availabilityId: booking.booking_date && booking.booking_time ? `${booking.booking_date}T${booking.booking_time}:00+03:00` : null,
      availability: null,
      contact: {
        fullName: booking.user_name || "Unknown",
        firstName: null,
        lastName: null,
        emailAddress: booking.user_email || null,
        phoneNumber: booking.user_phone || null,
        locales: ["en"],
        country: null,
        notes: null,
        postalCode: null
      },
      notes: booking.notes || null,
      deliveryMethods: [DeliveryMethod.VOUCHER],
      voucher: null,
      unitItems: []
    };

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Extend Booking:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", errorMessage: "Failed to extend booking" },
      { status: 500 }
    );
  }
}
