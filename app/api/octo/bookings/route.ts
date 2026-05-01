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

    // 1.a. OCTO Core Validation
    const finalUuid = uuid || crypto.randomUUID();

    if (!productId) {
      return NextResponse.json({ error: "INVALID_PRODUCT_ID", errorMessage: "Missing productId", productId: "" }, { status: 400 });
    }

    const { data: pkgData, error: pkgError } = await supabaseAdmin
      .from("packages")
      .select("price")
      .eq("id", productId)
      .single();

    if (pkgError || !pkgData) {
      return NextResponse.json({ error: "INVALID_PRODUCT_ID", errorMessage: "Product not found", productId: productId || "" }, { status: 400 });
    }

    if (!optionId || (optionId !== "DEFAULT" && optionId !== `opt_${productId}`)) {
      return NextResponse.json({ error: "INVALID_OPTION_ID", errorMessage: "Option not found", optionId: optionId || "" }, { status: 400 });
    }

    if (!availabilityId) {
      return NextResponse.json({ error: "INVALID_AVAILABILITY_ID", errorMessage: "Missing availabilityId", availabilityId: "" }, { status: 400 });
    }

    const [bookingDate, bookingTime] = availabilityId.split("T");
    if (!bookingDate || !bookingTime || (!availabilityId.includes("+03:00") && !availabilityId.includes("Z"))) {
      return NextResponse.json({ error: "INVALID_AVAILABILITY_ID", errorMessage: "Invalid availabilityId format", availabilityId: availabilityId || "" }, { status: 400 });
    }

    // Verify that the requested time slot actually exists in our system
    const slotTimeStr = bookingTime.substring(0, 5);
    const { data: surcharges } = await supabaseAdmin
      .from("time_surcharges")
      .select("time, surcharge_percentage");
      
    if (!surcharges || !surcharges.some((s: any) => s.time.substring(0, 5) === slotTimeStr)) {
      return NextResponse.json({ error: "INVALID_AVAILABILITY_ID", errorMessage: "Availability ID (slot) does not exist", availabilityId: availabilityId || "" }, { status: 400 });
    }

    if (!unitItems || !Array.isArray(unitItems) || unitItems.length === 0) {
      return NextResponse.json({ error: "UNPROCESSABLE_ENTITY", errorMessage: "Missing or empty unitItems" }, { status: 400 });
    }

    for (const item of unitItems) {
      if (!item.unitId || item.unitId !== `unit_${productId}_adult`) {
        return NextResponse.json({ error: "INVALID_UNIT_ID", errorMessage: "Unit ID not found or invalid", unitId: item.unitId || "" }, { status: 400 });
      }
    }

    // 2. Map OCTO request to your Supabase schema
    // Note: contact is completely optional in Booking Reservation.
    const safeContact = contact || {};
    const fullName = safeContact.fullName || `${safeContact.firstName || ""} ${safeContact.lastName || ""}`.trim() || "Unknown B2B Guest";
    const email = safeContact.emailAddress || `b2b-${uuid}@octotravel.com`;

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
      // B2B Bookings (Both local and global) get the NET price.
      // Net Price = Retail Price - 10% Commission
      const netPrice = slotRetailPrice * 0.9;
      totalAmount = netPrice * unitItems.length;
    }

    // 2.d. Insert booking
    const internalPayload = { unitItems, uuid: finalUuid };
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        package_id: productId,
        user_name: fullName,
        user_email: email,
        user_phone: contact.phoneNumber,
        booking_date: bookingDate,
        booking_time: bookingTime ? bookingTime.substring(0, 5) : null,
        // All OCTO reservations start as ON_HOLD (pending) until confirmed via the /confirm endpoint
        status: "pending", 
        total_amount: totalAmount, // Calculated dynamically from base price + time surcharges
        notes: `OCTO B2B Booking. Ref: ${resellerReference || "None"}. Type: ${authType}\n---OCTO_META---\n${JSON.stringify(internalPayload)}`,
        people_count: unitItems.length,
        locale: contact.locales?.[0] || "en",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 3. Construct OCTO Booking Response
    const octoStatus = BookingStatus.ON_HOLD;
    
    const octoBooking: Booking = {
      id: booking.id,
      uuid: finalUuid,
      testMode: false,
      resellerReference: resellerReference || null,
      supplierReference: booking.id,
      status: octoStatus,
      utcCreatedAt: new Date().toISOString(),
      utcUpdatedAt: new Date().toISOString(),
      utcExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour hold
      utcRedeemedAt: null,
      utcConfirmedAt: null,
      productId: productId,
      optionId: optionId || `opt_${productId}`,
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
        postalCode: contact.postalCode || null
      },
      notes: body.notes || null,
      deliveryMethods: [DeliveryMethod.VOUCHER],
      voucher: null, // E-ticket object
      unitItems: unitItems.map((item: any) => ({
        uuid: item.uuid || crypto.randomUUID(),
        unitId: item.unitId,
        resellerReference: item.resellerReference || null,
        supplierReference: null,
        status: octoStatus,
        utcRedeemedAt: null,
        contact: {
          fullName: item.contact?.fullName || null,
          firstName: item.contact?.firstName || null,
          lastName: item.contact?.lastName || null,
          emailAddress: item.contact?.emailAddress || null,
          phoneNumber: item.contact?.phoneNumber || null,
          locales: item.contact?.locales || ["en"],
          country: item.contact?.country || null,
          notes: item.contact?.notes || null,
          postalCode: item.contact?.postalCode || null
        },
        ticket: null
      }))
    };

    return NextResponse.json(octoBooking);
  } catch (error) {
    console.error("OCTO API Error - Bookings:", error);
    return NextResponse.json(
      { error: "Internal Server Error", errorMessage: "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!requireOctoAuth(request)) {
    return octoUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const resellerReference = searchParams.get("resellerReference");
  const supplierReference = searchParams.get("supplierReference");
  const productId = searchParams.get("productId");
  const localDateStart = searchParams.get("localDateStart");
  const localDateEnd = searchParams.get("localDateEnd");
  
  if (localDateStart && isNaN(Date.parse(localDateStart))) {
    return NextResponse.json({ error: "BAD_REQUEST", errorMessage: "Invalid localDateStart" }, { status: 400 });
  }
  if (localDateEnd && isNaN(Date.parse(localDateEnd))) {
    return NextResponse.json({ error: "BAD_REQUEST", errorMessage: "Invalid localDateEnd" }, { status: 400 });
  }
  
  try {
    let query = supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    // Simple filters
    if (resellerReference) {
      // We don't store resellerReference explicitly except in notes, but let's try to match it if we can.
      // For simplicity, we just filter loosely if needed, or ignore it if not strictly required by tests.
      query = query.ilike("notes", `%${resellerReference}%`);
    }
    if (supplierReference) {
      query = query.eq("id", supplierReference);
    }
    if (productId) {
      query = query.eq("package_id", productId);
    }

    const { data: bookings, error } = await query;

    if (error) {
      throw error;
    }

    const octoBookings: Booking[] = (bookings || []).map((b: any) => {
      let status = BookingStatus.ON_HOLD;
      if (b.status === "confirmed" || b.status === "completed") status = BookingStatus.CONFIRMED;
      if (b.status === "cancelled" || b.status === "failed") status = BookingStatus.CANCELLED;

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
            locales: ["en"],
            country: null,
            notes: null,
            postalCode: null
          },
          ticket: null
        }));
      } else {
        // Sync status for unitItems
        unitItems = unitItems.map(item => ({ ...item, status }));
      }

      return {
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
        notes: b.notes || null,
        deliveryMethods: [DeliveryMethod.VOUCHER],
        voucher: null,
        unitItems: unitItems
      };
    });

    return NextResponse.json(octoBookings);
  } catch (error) {
    console.error("OCTO API Error - List Bookings:", error);
    return NextResponse.json(
      { error: "Internal Server Error", errorMessage: "Failed to list bookings" },
      { status: 500 }
    );
  }
}
