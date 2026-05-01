import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Booking, BookingStatus, DeliveryMethod } from "@octocloud/types";

export async function POST(request: NextRequest) {
  // 1. Authenticate Request
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { 
      uuid, 
      productId, 
      optionId, 
      availabilityId, 
      unitItems, 
      contact, 
      resellerReference 
    } = body;

    if (!uuid || !productId || !unitItems || !contact) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing required booking fields" },
        { status: 400 }
      );
    }

    // 2. Map OCTO request to your Supabase schema
    const [bookingDate, bookingTime] = availabilityId ? availabilityId.split("T") : [null, null];
    const fullName = contact.fullName || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown B2B Guest";
    const email = contact.emailAddress || `b2b-${uuid}@octotravel.com`;

    // 2.a. Ensure customer exists to satisfy foreign key constraint
    const { error: customerError } = await supabaseAdmin
      .from("customers")
      .upsert(
        { email: email, name: fullName, phone: contact.phoneNumber },
        { onConflict: "email" }
      );
      
    if (customerError) {
      throw customerError;
    }

    // 2.b. Insert booking
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        package_id: productId,
        user_name: fullName,
        user_email: email,
        user_phone: contact.phoneNumber,
        booking_date: bookingDate,
        booking_time: bookingTime ? bookingTime.substring(0, 5) : null,
        // Automatically confirm B2B bookings because the agency already collected payment
        status: "confirmed", 
        total_amount: 0, // In B2B, the agency handles the money. 
        notes: `OCTO B2B Booking. Ref: ${resellerReference || "None"}`,
        people_count: unitItems.length,
        locale: contact.locales?.[0] || "en",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 3. Construct OCTO Booking Response
    const octoBooking: Booking = {
      id: booking.id,
      uuid: uuid,
      testMode: false,
      resellerReference: resellerReference || null,
      supplierReference: booking.id,
      status: BookingStatus.CONFIRMED,
      utcCreatedAt: new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: null,
      utcRedeemedAt: null,
      utcConfirmedAt: new Date().toISOString(),
      productId: productId,
      optionId: optionId || "standard",
      cancellable: true,
      cancellation: null,
      freesale: false,
      availabilityId: availabilityId,
      availability: null, // Should return the Availability object if queried
      contact: {
        fullName: contact.fullName || null,
        firstName: contact.firstName || null,
        lastName: contact.lastName || null,
        emailAddress: contact.emailAddress || null,
        phoneNumber: contact.phoneNumber || null,
        locales: contact.locales || ["en"],
        country: contact.country || null,
        notes: contact.notes || null,
        postalCode: null
      },
      notes: null,
      deliveryMethods: [DeliveryMethod.VOUCHER],
      voucher: null, // E-ticket object
      unitItems: unitItems.map((item: any) => ({
        uuid: item.uuid || crypto.randomUUID(),
        unitId: item.unitId,
        resellerReference: item.resellerReference || null,
        contact: item.contact || null
      }))
    };

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Bookings:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create booking" },
      { status: 500 }
    );
  }
}
