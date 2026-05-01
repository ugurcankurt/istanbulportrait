import { Booking, BookingStatus, DeliveryMethod } from "@octocloud/types";

export function mapBookingToOcto(b: any, requestUuid?: string): Booking {
  let status = BookingStatus.ON_HOLD;
  if (b.status === "confirmed" || b.status === "completed") status = BookingStatus.CONFIRMED;
  if (b.status === "cancelled" || b.status === "failed") status = BookingStatus.CANCELLED;

  let finalUuid = b.octo_uuid || requestUuid || b.id;
  let unitItems: any[] = [];
  let expiresAt = new Date(new Date(b.created_at).getTime() + 60 * 60 * 1000).toISOString(); // Default 1 hour

  if (b.octo_data) {
    if (b.octo_data.unitItems && Array.isArray(b.octo_data.unitItems)) {
      unitItems = b.octo_data.unitItems;
    }
    if (b.octo_data.expiresAt) {
      expiresAt = b.octo_data.expiresAt;
    }
  }

  // Fallback for old notes migration if any
  if (unitItems.length === 0 && b.notes && b.notes.includes("---OCTO_META---")) {
    try {
      const metaStr = b.notes.split("---OCTO_META---\n")[1];
      const meta = JSON.parse(metaStr);
      if (meta.unitItems && Array.isArray(meta.unitItems)) unitItems = meta.unitItems;
      if (meta.uuid) finalUuid = meta.uuid;
      if (meta.expiresAt) expiresAt = meta.expiresAt;
    } catch (e) {}
  }

  // Ensure unitItems has required schema fields
  if (unitItems.length === 0) {
    const count = b.people_count || 1;
    unitItems = Array.from({ length: count }).map((_, i) => ({
      uuid: crypto.randomUUID(),
      unitId: `unit_${b.package_id}_adult`,
      resellerReference: null,
      supplierReference: null,
      status: status,
      utcRedeemedAt: null,
      contact: {
        fullName: b.user_name || undefined,
        firstName: undefined,
        lastName: undefined,
        emailAddress: b.user_email || undefined,
        phoneNumber: b.user_phone || undefined,
        locales: b.locale ? [b.locale] : ["en"],
        country: undefined,
        notes: undefined,
        postalCode: undefined
      },
      ticket: null
    }));
  } else {
    // Map existing unitItems to ensure they have the full strict schema
    unitItems = unitItems.map((item, i) => ({
      uuid: item.uuid || crypto.randomUUID(),
      unitId: item.unitId || `unit_${b.package_id}_adult`,
      resellerReference: item.resellerReference || null,
      supplierReference: item.supplierReference || null,
      status: status,
      utcRedeemedAt: null,
      contact: {
        fullName: item.contact?.fullName || b.user_name || undefined,
        firstName: item.contact?.firstName || undefined,
        lastName: item.contact?.lastName || undefined,
        emailAddress: item.contact?.emailAddress || b.user_email || undefined,
        phoneNumber: item.contact?.phoneNumber || b.user_phone || undefined,
        locales: item.contact?.locales || (b.locale ? [b.locale] : ["en"]),
        country: item.contact?.country || undefined,
        notes: item.contact?.notes || undefined,
        postalCode: item.contact?.postalCode || undefined
      },
      ticket: null
    }));
  }

  let availabilityIdStr: string | null = null;
  if (b.booking_date && b.booking_time) {
    const slotTime = b.booking_time.substring(0, 5); // ensure HH:mm
    availabilityIdStr = `${b.booking_date}T${slotTime}:00+03:00`;
  }

  let availabilityObj: any = null;
  if (availabilityIdStr) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const startHour = parseInt(b.booking_time.substring(0, 2));
    const endHour = Math.min(23, startHour + 1);
    const safeEndStr = `${b.booking_date}T${pad(endHour)}:${b.booking_time.substring(3, 5)}:00+03:00`;

    availabilityObj = {
      id: availabilityIdStr,
      localDateTimeStart: availabilityIdStr,
      localDateTimeEnd: safeEndStr,
      allDay: false,
      status: "AVAILABLE",
      vacancies: 1,
      capacity: 1,
      maxUnits: 10,
      utcCutoffAt: new Date(b.created_at).toISOString(),
      available: true,
      openingHours: []
    };
  }

  const octoBooking: Booking = {
    id: b.id,
    uuid: finalUuid,
    testMode: false,
    resellerReference: b.octo_data?.resellerReference || (finalUuid ? `RES-${finalUuid.substring(0, 5)}` : null),
    supplierReference: b.id,
    status: status,
    utcCreatedAt: new Date(b.created_at).toISOString(),
    utcUpdatedAt: b.updated_at ? new Date(b.updated_at).toISOString() : new Date(b.created_at).toISOString(),
    utcExpiresAt: status === BookingStatus.ON_HOLD ? expiresAt : null,
    utcRedeemedAt: null,
    utcConfirmedAt: status === BookingStatus.CONFIRMED ? new Date(b.created_at).toISOString() : null,
    productId: b.package_id || "unknown",
    optionId: b.octo_data?.optionId || `opt_${b.package_id || "unknown"}`,
    cancellable: true,
    cancellation: status === BookingStatus.CANCELLED ? {
      refund: "FULL" as any,
      reason: b.octo_data?.cancellationReason || "Cancelled",
      utcCancelledAt: new Date().toISOString()
    } : null,
    freesale: false,
    availabilityId: availabilityIdStr,
    availability: availabilityObj,
    contact: {
      fullName: b.user_name || undefined,
      firstName: b.octo_data?.contact?.firstName || undefined,
      lastName: b.octo_data?.contact?.lastName || undefined,
      emailAddress: b.user_email || undefined,
      phoneNumber: b.user_phone || undefined,
      locales: b.locale ? [b.locale] : ["en"],
      country: b.octo_data?.contact?.country || undefined,
      notes: b.octo_data?.contact?.notes || undefined,
      postalCode: b.octo_data?.contact?.postalCode || undefined
    },
    notes: b.notes || null,
    deliveryMethods: [DeliveryMethod.VOUCHER],
    voucher: {
      redemptionMethod: "DIGITAL" as any,
      utcRedeemedAt: null,
      deliveryOptions: []
    },
    unitItems: unitItems
  };

  return octoBooking;
}
