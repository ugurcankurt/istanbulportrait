/**
 * Analytics utilities for tracking events
 */

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
    // Set Enhanced Conversions user data if provided
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

  // Track Facebook Purchase
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
) {
  // Generate event_id for Pixel/CAPI deduplication if not provided
  const resolvedEventId = eventId || (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "view_item", {
      currency: currency,
      value: value,
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
    window.fbq("track", "ViewContent", {
      content_ids: [itemId],
      content_type: "product",
      content_name: itemName,
      value: value,
      currency: "EUR",
    }, resolvedEventId ? { eventID: resolvedEventId } : undefined);
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
        custom_data: { content_name: itemName },
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
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "InitiateCheckout",
        package_id: packageId,
        amount: value,
        custom_data: {
          content_name: packageName,
          event_id: eventId,
        },
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
  const resolvedEventId = eventId || (typeof crypto !== "undefined" ? crypto.randomUUID() : undefined);

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
    window.fbq("track", "AddPaymentInfo", {
      content_ids: [packageId],
      content_name: packageName,
      content_type: "product",
      value: value,
      currency: "EUR",
    }, resolvedEventId ? { eventID: resolvedEventId } : undefined);
  }

  // Facebook CAPI — AddPaymentInfo (server-side, Safari-proof)
  if (typeof window !== "undefined") {
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "AddPaymentInfo",
        event_id: resolvedEventId,
        package_id: packageId,
        amount: value,
        custom_data: { content_name: packageName, payment_type: paymentType },
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
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "generate_lead", {
      currency: currency,
      value: value,
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

  // Also track for Facebook
  trackFacebookEvent(
    "Lead",
    {
      content_ids: [packageId],
      content_name: packageName,
      value: value,
      currency: "EUR",
    },
    eventId,
  );
}

// Track view item list event (GA4 Enhanced Ecommerce — funnel step 1)
export function trackViewItemList(
  items: Array<{
    id: string;
    name: string;
    price: number;
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
        item_category: "Photography Package",
        price: item.price,
        quantity: 1,
        index: index + 1,
      })),
    });
  }
}

// Generic event function (alias for trackEvent)
export const event = trackEvent;
