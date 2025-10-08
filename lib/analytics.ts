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
) {
  if (typeof window !== "undefined" && window.gtag) {
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
}

// Track Facebook events
export function trackFacebookEvent(eventType: string, data?: any) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventType, data);
  }
}

// Track view item events (GA4 Enhanced Ecommerce)
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

// Generic event function (alias for trackEvent)
export const event = trackEvent;
