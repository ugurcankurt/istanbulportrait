import { NextRequest, NextResponse } from "next/server";
import { requireOctoAuth, octoUnauthorizedResponse, getOctoAuthType } from "@/lib/octo-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Booking, BookingStatus } from "@octocloud/types";
import { mapBookingToOcto } from "@/lib/octo-mapper";

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

    const slotTimeStr = bookingTime.substring(0, 5);
    const h = parseInt(slotTimeStr.substring(0, 2));
    if (isNaN(h) || h < 6 || h > 22) {
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
        { email: email, name: fullName, phone: safeContact.phoneNumber || "" },
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
    const internalPayload = { unitItems, uuid: finalUuid, resellerReference: resellerReference || null, contact: safeContact };
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        package_id: productId,
        user_name: fullName,
        user_email: email,
        user_phone: safeContact.phoneNumber || "",
        booking_date: bookingDate,
        booking_time: bookingTime ? bookingTime.substring(0, 5) : null,
        // All OCTO reservations start as ON_HOLD (pending) until confirmed via the /confirm endpoint
        status: "pending", 
        total_amount: totalAmount, // Calculated dynamically from base price + time surcharges
        notes: `OCTO B2B Booking. Ref: ${resellerReference || "None"}. Type: ${authType}`,
        octo_uuid: finalUuid,
        octo_data: internalPayload,
        people_count: unitItems.length,
        locale: safeContact.locales?.[0] || "en",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 3. Construct OCTO Booking Response
    const octoStatus = BookingStatus.ON_HOLD;
    
    const octoBooking = mapBookingToOcto(booking, finalUuid);

    return NextResponse.json(octoBooking);
  } catch (error: any) {
    console.error("OCTO API Error - Bookings:", error);
    return NextResponse.json(
      { error: "Internal Server Error", errorMessage: error?.message || "Failed to create booking", stack: error?.stack },
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

  // OCTO requires at least one of these to be present
  if (!resellerReference && !supplierReference && !(localDateStart && localDateEnd)) {
    return NextResponse.json({ error: "BAD_REQUEST", errorMessage: "Must provide resellerReference, supplierReference, or localDateStart/End" }, { status: 400 });
  }
  
  try {
    let query = supabaseAdmin
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    // Simple filters
    if (resellerReference) {
      // JSON operators inside .or() string can throw parsing errors in PostgREST. 
      // We rely on 'notes' ilike match which we appended in POST and confirm endpoints.
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
      return mapBookingToOcto(b);
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
