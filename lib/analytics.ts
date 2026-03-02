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

// Track view item events (GA4 Enhanced Ecommerce)
// Note: We don't usually deduplicate ViewContent, but adding support is fine
export function trackViewItem(
  itemId: string,
  itemName: string,
  value?: number,
  currency: string = "EUR",
) {
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

  // Also track for Facebook
  trackFacebookEvent("ViewContent", {
    content_ids: [itemId],
    content_type: "product",
    content_name: itemName,
    value: value,
    currency: "EUR",
  });
}

// Track begin checkout event (GA4 Enhanced Ecommerce)
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

  // Also track for Facebook
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
}

// Track add payment info event (GA4 Enhanced Ecommerce)
export function trackAddPaymentInfo(
  packageId: string,
  packageName: string,
  value: number,
  paymentType: string = "credit_card",
  currency: string = "EUR",
) {
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

// Generic event function (alias for trackEvent)
export const event = trackEvent;
