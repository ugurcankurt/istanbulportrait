import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Booking, BookingStatus, DeliveryMethod } from "@octocloud/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  const { uuid } = await params;

  try {
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", uuid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Update status to CANCELLED
    if (booking) {
      await supabaseAdmin
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id);
    }

    // Return OCTO Booking Response
    const octoBooking: Booking = {
      id: booking ? booking.id : uuid,
      uuid: uuid,
      testMode: false,
      resellerReference: "RES-" + uuid.substring(0, 5),
      supplierReference: booking ? booking.id : uuid,
      status: BookingStatus.CANCELLED,
      utcCreatedAt: new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: null,
      utcRedeemedAt: null,
      utcConfirmedAt: null,
      productId: booking ? booking.package_id : "unknown",
      optionId: "standard",
      cancellable: false,
      cancellation: {
        refund: "FULL" as any, // Simple mock
        reason: "Cancelled by Reseller",
        utcCancelledAt: new Date().toISOString()
      },
      freesale: false,
      availabilityId: null,
      availability: null,
      contact: {
        fullName: booking ? booking.user_name : "Unknown",
        firstName: null,
        lastName: null,
        emailAddress: booking ? booking.user_email : null,
        phoneNumber: booking ? booking.user_phone : null,
        locales: ["en"],
        country: null,
        notes: null,
        postalCode: null
      },
      notes: null,
      deliveryMethods: [DeliveryMethod.VOUCHER],
      voucher: null,
      unitItems: []
    };

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Cancel Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
