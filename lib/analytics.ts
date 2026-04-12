/**
 * Analytics utilities for tracking events
 */
import { fbPixel } from "./facebook";

export interface AnalyticsUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  dob?: string;
  gender?: string;
}

/**
 * Storage key for hashed user data to persist Advanced Matching
 */
const AM_STORAGE_KEY = "istanbul_portrait_am_data";

/**
 * Safely saves hashed user data for Advanced Matching persistence
 */
export function saveUserDataForAdvancedMatching(userData: AnalyticsUserData) {
  if (typeof window === "undefined") return;

  try {
    // Get existing data to merge
    const existingRaw = localStorage.getItem(AM_STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};

    const updated = { ...existing, ...userData };
    localStorage.setItem(AM_STORAGE_KEY, JSON.stringify(updated));

    // Also update the Pixel's active user data if possible
    // Note: This won't re-init the pixel, but it can be used for future events
  } catch (e) {
    console.error("Failed to save AM data", e);
  }
}

/**
 * Retrieves persisted user data for Advanced Matching
 */
export function getUserDataForAdvancedMatching(): AnalyticsUserData | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = localStorage.getItem(AM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch (e) {
    return undefined;
  }
}

// Google Analytics event tracking //
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number,
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Track booking events
export function trackBookingEvent(
  eventType: string,
  packageId?: string,
  value?: number,
) {
  trackEvent(eventType, "Booking", packageId, value);
}

// Track page views
export function trackPageView(url: string, title?: string) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "", {
      page_location: url,
      page_title: title,
    });
  }
}

// Track package interest
export function trackPackageInterest(packageName: string) {
  trackEvent("package_interest", "Packages", packageName);
}

// Track form submissions
export function trackFormSubmission(formType: string) {
  trackEvent("form_submit", "Forms", formType);
}

// Track payment events
export function trackPaymentEvent(
  packageId: string,
  value: number,
  status: string,
) {
  trackEvent(`payment_${status}`, "Payment", packageId, value);
}

// Track purchase events (GA4 Enhanced Ecommerce)
export function trackPurchase(
  transactionId: string,
  packageId: string,
  packageName: string,
  value: number,
  currency: string = "EUR",
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
  },
  eventId?: string,
) {
  if (typeof window !== "undefined" && window.gtag) {
    // Set Enhanced Conversions user data for GA4/Google Ads
    if (userData) {
      window.gtag("set", "user_data", {
        email: userData.email,
        phone_number: userData.phone,
        address: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          city: userData.city || "Istanbul",
          country: userData.country || "TR",
        },
      });
    }

    // Google Ads Direct Conversion (AW-1007335227)
    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    if (adsId && typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "conversion", {
        send_to: `${adsId}/_syvCOGqm5ccELvuquAD`, // Specific purchase label from Ads panel
        value: value,
        currency: currency,
        transaction_id: transactionId,
      });
    }

    // Google Analytics 4 — Purchase (Ecommerce)
    window.gtag("event", "purchase", {
      transaction_id: transactionId,
      currency: currency,
      value: value,
      items: [
        {
          item_id: packageId,
          item_name: packageName,
          item_category: "Photography Package",
          price: value,
          quantity: 1,
        },
      ],
    });
  }

  // Track Facebook Purchase (client-side)
  trackFacebookEvent(
    "Purchase",
    {
      content_ids: [packageId],
      content_name: packageName,
      value: value,
      currency: "EUR",
      transaction_id: transactionId,
    },
    eventId,
  );

  // Facebook CAPI — Purchase (server-side)
  if (typeof window !== "undefined") {
    const resolvedUserData = userData || getUserDataForAdvancedMatching();
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "Purchase",
        event_id: eventId,
        package_id: packageId,
        amount: value,
        transaction_id: transactionId,
        customer_email: resolvedUserData?.email,
        customer_phone: resolvedUserData?.phone,
        first_name: resolvedUserData?.firstName,
        last_name: resolvedUserData?.lastName,
        city: resolvedUserData?.city,
        country: resolvedUserData?.country,
        custom_data: { content_name: packageName },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

// Track Facebook events
export function trackFacebookEvent(
  eventType: string,
  data?: any,
  eventId?: string,
) {
  if (typeof window !== "undefined" && window.fbq) {
    if (eventId) {
      window.fbq("track", eventType, data, { eventID: eventId });
    } else {
      window.fbq("track", eventType, data);
    }
  }
}

// Track view item events (GA4 Enhanced Ecommerce + Facebook Pixel + CAPI)
export function trackViewItem(
  itemId: string,
  itemName: string,
  value?: number,
  currency: string = "EUR",
  eventId?: string,
  providedUserData?: AnalyticsUserData,
) {
  // Use provided data or fall back to persisted data
  const userData = providedUserData || getUserDataForAdvancedMatching();

  // Generate event_id for Pixel/CAPI deduplication if not provided
  const resolvedEventId =
    eventId ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      currency: currency,
      value: value || 0,
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          item_category: "Photography Package",
          price: value || 0,
          quantity: 1,
        },
      ],
    });
  }

  // Facebook Pixel — ViewContent (client-side)
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(
      "track",
      "ViewContent",
      {
        content_ids: [itemId],
        content_type: "product",
        content_name: itemName,
        value: value,
        currency: "EUR",
      },
      resolvedEventId ? { eventID: resolvedEventId } : undefined,
    );
  }

  // Facebook CAPI — ViewContent (server-side, Safari-proof)
  if (typeof window !== "undefined") {
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "ViewContent",
        event_id: resolvedEventId,
        package_id: itemId,
        amount: value,
        customer_email: userData?.email,
        customer_phone: userData?.phone,
        first_name: userData?.firstName,
        last_name: userData?.lastName,
        city: userData?.city,
        state: userData?.state,
        zip: userData?.zip,
        country: userData?.country,
        dob: userData?.dob,
        gender: userData?.gender,
        custom_data: { content_name: itemName },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

// Track begin checkout event (GA4 Enhanced Ecommerce + Facebook Pixel + CAPI)
export function trackBeginCheckout(
  packageId: string,
  packageName: string,
  value: number,
  currency: string = "EUR",
  eventId?: string,
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "begin_checkout", {
      currency: currency,
      value: value,
      items: [
        {
          item_id: packageId,
          item_name: packageName,
          item_category: "Photography Package",
          price: value,
          quantity: 1,
        },
      ],
    });
  }

  // Facebook Pixel — InitiateCheckout (client-side)
  trackFacebookEvent(
    "InitiateCheckout",
    {
      content_ids: [packageId],
      content_name: packageName,
      content_type: "product",
      value: value,
      currency: "EUR",
    },
    eventId,
  );

  // Facebook CAPI — InitiateCheckout (server-side, Safari-proof)
  // Fire-and-forget via our existing /api/facebook/conversions endpoint
  if (typeof window !== "undefined") {
    const userData = getUserDataForAdvancedMatching();
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "InitiateCheckout",
        event_id: eventId,
        package_id: packageId,
        amount: value,
        customer_email: userData?.email,
        customer_phone: userData?.phone,
        first_name: userData?.firstName,
        last_name: userData?.lastName,
        custom_data: {
          content_name: packageName,
        },
        event_source_url: window.location.href,
      }),
    }).catch(() => {
      // Non-blocking — pixel already fired above
    });
  }
}

// Track add payment info event (GA4 Enhanced Ecommerce + Facebook)
export function trackAddPaymentInfo(
  packageId: string,
  packageName: string,
  value: number,
  paymentType: string = "credit_card",
  currency: string = "EUR",
  eventId?: string,
) {
  // Generate event_id for Pixel/CAPI deduplication if not provided
  const resolvedEventId =
    eventId ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "add_payment_info", {
      currency: currency,
      value: value,
      payment_type: paymentType,
      items: [
        {
          item_id: packageId,
          item_name: packageName,
          item_category: "Photography Package",
          price: value,
          quantity: 1,
        },
      ],
    });
  }

  // Facebook Pixel — AddPaymentInfo (client-side)
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(
      "track",
      "AddPaymentInfo",
      {
        content_ids: [packageId],
        content_name: packageName,
        content_type: "product",
        value: value,
        currency: "EUR",
      },
      resolvedEventId ? { eventID: resolvedEventId } : undefined,
    );
  }

  // Facebook CAPI — AddPaymentInfo (server-side, Safari-proof)
  if (typeof window !== "undefined") {
    const userData = getUserDataForAdvancedMatching();
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "AddPaymentInfo",
        event_id: resolvedEventId,
        package_id: packageId,
        amount: value,
        customer_email: userData?.email,
        customer_phone: userData?.phone,
        first_name: userData?.firstName,
        last_name: userData?.lastName,
        custom_data: { content_name: packageName, payment_type: paymentType },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

// Track lead generation event (GA4)
export function trackLead(
  packageId: string,
  packageName: string,
  value?: number,
  currency: string = "EUR",
  eventId?: string,
) {
  const resolvedEventId =
    eventId ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    // Lead Enhanced Conversions for Google Ads 2026
    const userData = getUserDataForAdvancedMatching();
    if (userData?.email || userData?.phone) {
      window.gtag("set", "user_data", {
        email: userData.email,
        phone_number: userData.phone,
        address: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        },
      });
    }

    // Direct Google Ads Lead Conversion
    const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
    if (adsId) {
      window.gtag("event", "conversion", {
        send_to: `${adsId}/pS27CPbelZUcELvuquAD`, // Specific lead label from Ads panel
        value: value,
        currency: currency,
      });
    }

    window.gtag("event", "generate_lead", {
      currency: currency,
      value: value || 0,
      items: [
        {
          item_id: packageId,
          item_name: packageName,
          item_category: "Photography Package",
          price: value || 0,
          quantity: 1,
        },
      ],
    });
  }

  // Facebook Pixel — Lead
  trackFacebookEvent(
    "Lead",
    {
      content_ids: [packageId],
      content_name: packageName,
      content_type: "product",
      value: value,
      currency: "EUR",
    },
    resolvedEventId, // Fixed parameter mismatch
  );

  // Facebook CAPI — Lead (server-side, Safari-proof)
  if (typeof window !== "undefined") {
    const userData = getUserDataForAdvancedMatching();
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "Lead",
        event_id: resolvedEventId,
        package_id: packageId,
        amount: value,
        customer_email: userData?.email,
        customer_phone: userData?.phone,
        first_name: userData?.firstName,
        last_name: userData?.lastName,
        custom_data: { content_name: packageName },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

// Track schedule event (When user picks a date via calendar)
export function trackSchedule(
  packageId: string,
  packageName: string,
  scheduledDate: string,
  eventId?: string,
) {
  const resolvedEventId =
    eventId ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "schedule", {
      event_category: "Booking",
      event_label: packageId,
    });
  }

  // Facebook Pixel — Schedule
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(
      "track",
      "Schedule",
      {
        content_ids: [packageId],
        content_name: packageName,
        content_category: "Photography Session",
        content_type: "product",
      },
      resolvedEventId ? { eventID: resolvedEventId } : undefined,
    );
  }

  // Facebook CAPI — Schedule
  if (typeof window !== "undefined") {
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "Schedule",
        event_id: resolvedEventId,
        package_id: packageId,
        custom_data: {
          content_name: packageName,
          scheduled_date: scheduledDate,
          content_type: "product",
        },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

// Track view item list event (GA4 Enhanced Ecommerce — funnel step 1)
export function trackViewItemList(
  items: Array<{
    id: string;
    name: string;
    price: number;
    category?: string;
  }>,
  listId: string = "packages",
  listName: string = "Photography Packages",
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item_list", {
      item_list_id: listId,
      item_list_name: listName,
      items: items.map((item, index) => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category || "Photography Package",
        price: item.price,
        quantity: 1,
        index: index + 1,
      })),
    });
  }
}

// Track select item event (GA4 Enhanced Ecommerce — funnel step 2)
export function trackSelectItem(
  item: {
    id: string;
    name: string;
    price: number;
    category?: string;
  },
  listName: string = "Photography Packages",
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "select_item", {
      item_list_name: listName,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category || "Photography Package",
          price: item.price,
          quantity: 1,
        },
      ],
    });
  }
}

// Track package add to cart (GA4 Enhanced Ecommerce + Meta)
export function trackPackageAddToCart(
  packageId: string,
  packageName: string,
  value: number,
  currency: string = "EUR",
  eventId?: string,
) {
  const resolvedEventId =
    eventId ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency: currency,
      value: value,
      items: [
        {
          item_id: packageId,
          item_name: packageName,
          item_category: "Photography Package",
          price: value,
          quantity: 1,
        },
      ],
    });
  }

  // Facebook Pixel — AddToCart
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(
      "track",
      "AddToCart",
      {
        content_ids: [packageId],
        content_type: "product",
        content_name: packageName,
        value: value,
        currency: "EUR",
      },
      resolvedEventId ? { eventID: resolvedEventId } : undefined,
    );
  }

  // Facebook CAPI — AddToCart
  if (typeof window !== "undefined") {
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "AddToCart",
        event_id: resolvedEventId,
        package_id: packageId,
        amount: value,
        custom_data: { content_name: packageName },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

// Print Specific Tracking Functions //

export function trackPrintViewItem(
  sku: string,
  name: string,
  category: string,
  price: number,
  currency: string = "EUR",
  eventId?: string,
) {
  const resolvedEventId =
    eventId ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      currency: currency,
      value: price,
      items: [
        {
          item_id: sku,
          item_name: name,
          item_category: "Print",
          item_variant: category,
          price: price,
          quantity: 1,
        },
      ],
    });
  }

  // Facebook Pixel — ViewContent for Catalog
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(
      "track",
      "ViewContent",
      {
        content_ids: [sku],
        content_type: "product",
        content_name: name,
        content_category: category,
        value: price,
        currency: currency,
      },
      resolvedEventId ? { eventID: resolvedEventId } : undefined,
    );
  }

  // Facebook CAPI — ViewContent
  if (typeof window !== "undefined") {
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "ViewContent",
        event_id: resolvedEventId,
        package_id: sku,
        amount: price,
        custom_data: { content_name: name, content_category: category },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

export function trackPrintAddToCart(
  sku: string,
  name: string,
  category: string,
  price: number,
  currency: string = "EUR",
  eventId?: string,
) {
  const resolvedEventId =
    eventId ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "add_to_cart", {
      currency: currency,
      value: price,
      items: [
        {
          item_id: sku,
          item_name: name,
          item_category: "Print",
          item_variant: category,
          price: price,
          quantity: 1,
        },
      ],
    });
  }

  // Facebook Pixel — AddToCart for Catalog
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(
      "track",
      "AddToCart",
      {
        content_ids: [sku],
        content_type: "product",
        content_name: name,
        content_category: category,
        value: price,
        currency: currency,
      },
      resolvedEventId ? { eventID: resolvedEventId } : undefined,
    );
  }

  // Facebook CAPI — AddToCart
  if (typeof window !== "undefined") {
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "AddToCart",
        event_id: resolvedEventId,
        package_id: sku,
        amount: price,
        custom_data: { content_name: name, content_category: category },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

export function trackPrintBeginCheckout(
  items: Array<{
    sku: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>,
  totalValue: number,
  currency: string = "EUR",
  eventId?: string,
) {
  const resolvedEventId =
    eventId ||
    (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "begin_checkout", {
      currency: currency,
      value: totalValue,
      items: items.map((item) => ({
        item_id: item.sku,
        item_name: item.name,
        item_category: "Print",
        item_variant: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  }

  const contentIds = items.map((item) => item.sku);

  // Facebook Pixel — InitiateCheckout
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq(
      "track",
      "InitiateCheckout",
      {
        content_ids: contentIds,
        content_type: "product",
        value: totalValue,
        currency: currency,
        num_items: items.reduce((acc, curr) => acc + curr.quantity, 0),
      },
      resolvedEventId ? { eventID: resolvedEventId } : undefined,
    );
  }

  // Facebook CAPI — InitiateCheckout
  if (typeof window !== "undefined") {
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "InitiateCheckout",
        event_id: resolvedEventId,
        package_id: contentIds[0] || "print_checkout", // Use first item or fallback for CAPI validation
        amount: totalValue,
        custom_data: {
          content_ids: contentIds,
          num_items: items.reduce((acc, curr) => acc + curr.quantity, 0),
        },
        event_source_url: window.location.href,
      }),
    }).catch(() => { });
  }
}

// Generic event function (alias for trackEvent)
export const event = trackEvent;
