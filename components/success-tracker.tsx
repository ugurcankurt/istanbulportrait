"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/analytics";

interface SuccessTrackerProps {
  bookingId: string;
  packageId: string;
  totalAmount: number;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

/**
 * SuccessTracker — fires GA4 purchase + Google Ads conversion with Enhanced Conversions
 * (hashed user data) when the /checkout/success page is accessed.
 * Guards against double-firing using sessionStorage deduplication.
 */
export function SuccessTracker({
  bookingId,
  packageId,
  totalAmount,
  customerEmail,
  customerPhone,
  customerName,
}: SuccessTrackerProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    // Deduplication: skip if checkout-form already fired for this booking
    const firedKey = `purchase_tracked_${bookingId}`;
    const alreadyTracked = sessionStorage.getItem(firedKey);
    if (alreadyTracked) return;

    // Mark as tracked to prevent double-counting
    sessionStorage.setItem(firedKey, "1");

    const nameParts = (customerName || "").trim().split(" ");
    const firstName = nameParts[0] || undefined;
    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

    // Fire purchase event with Enhanced Conversions (GA4 + Google Ads + Meta Pixel)
    trackPurchase(bookingId, packageId, packageId, totalAmount, "EUR", {
      email: customerEmail,
      phone: customerPhone,
      firstName,
      lastName,
    });
  }, [
    bookingId,
    packageId,
    totalAmount,
    customerEmail,
    customerPhone,
    customerName,
  ]);

  return null;
}
