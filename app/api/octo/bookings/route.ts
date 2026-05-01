import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse, getOctoAuthType } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Booking, BookingStatus, DeliveryMethod } from "@octocloud/types";

export async function POST(request: NextRequest) {
  // 1. Authenticate Request
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }
  
  const authType = getOctoAuthType(request); // "global" | "local"

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

    // 2.c. Calculate exact pricing based on time surcharges
    let totalAmount = 0;
    const { data: pkgData } = await supabaseAdmin
      .from("packages")
      .select("price")
      .eq("id", productId)
      .single();

    if (pkgData) {
      const basePrice = pkgData.price || 0;
      let slotRetailPrice = basePrice;
      
      if (bookingTime) {
        const slot = bookingTime.substring(0, 5); // "06:00"
        const { data: surcharges } = await supabaseAdmin
          .from("time_surcharges")
          .select("time, surcharge_percentage");
          
        if (surcharges && surcharges.length > 0) {
          const exactMatch = surcharges.find((s: any) => s.time === slot);
          const genericMatch = surcharges.find((s: any) => s.time === slot.replace(":30", ":00"));
          const activeSurcharge = exactMatch || genericMatch;
          
          if (activeSurcharge) {
            slotRetailPrice = basePrice * (1 + activeSurcharge.surcharge_percentage / 100);
          }
        }
      }
      
      // If the agency sent pricing, we could validate it here. For now, we trust our own DB source of truth.
      // E.g., if it's 2 people, we multiply by people count if package is per_person. 
      // OCTO usually sends total items in unitItems array.
      totalAmount = slotRetailPrice * unitItems.length;
    }

    // 2.d. Insert booking
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        package_id: productId,
        user_name: fullName,
        user_email: email,
        user_phone: contact.phoneNumber,
        booking_date: bookingDate,
        booking_time: bookingTime ? bookingTime.substring(0, 5) : null,
        // Automatically confirm B2B bookings if global agency. If local, wait for payment.
        status: authType === "local" ? "pending" : "confirmed", 
        total_amount: totalAmount, // Calculated dynamically from base price + time surcharges
        notes: `OCTO B2B Booking. Ref: ${resellerReference || "None"}. Type: ${authType}`,
        people_count: unitItems.length,
        locale: contact.locales?.[0] || "en",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 3. Construct OCTO Booking Response
    const octoStatus = authType === "local" ? BookingStatus.ON_HOLD : BookingStatus.CONFIRMED;
    const paymentUrl = authType === "local" ? `https://istanbulportrait.com/en/checkout/b2b-pay?bookingId=${booking.id}` : null;
    
    const octoBooking: Booking & { paymentUrl?: string } = {
      id: booking.id,
      uuid: uuid,
      testMode: false,
      resellerReference: resellerReference || null,
      supplierReference: booking.id,
      status: octoStatus,
      utcCreatedAt: new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: authType === "local" ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null, // 1 hour to pay
      utcRedeemedAt: null,
      utcConfirmedAt: authType === "global" ? new Date().toISOString() : null,
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
      notes: paymentUrl ? `PAYMENT_REQUIRED: Please pay via this link to confirm: ${paymentUrl}` : null,
      paymentUrl: paymentUrl || undefined, // Custom extension field for ease of use
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
