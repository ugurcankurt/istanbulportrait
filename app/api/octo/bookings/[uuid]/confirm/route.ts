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

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Update status to CONFIRMED
    if (booking) {
      await supabaseAdmin
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);
    }

    // 3. Construct response
    const octoBooking: Booking = {
      id: booking ? booking.id : uuid,
      uuid: uuid,
      testMode: false,
      resellerReference: "RES-" + uuid.substring(0, 5),
      supplierReference: booking ? booking.id : uuid,
      status: BookingStatus.CONFIRMED,
      utcCreatedAt: new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: null,
      utcRedeemedAt: null,
      utcConfirmedAt: new Date().toISOString(),
      productId: booking ? booking.package_id : "unknown",
      optionId: "standard",
      cancellable: true,
      cancellation: null,
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
    console.error("OCTO API Error - Confirm Booking:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
