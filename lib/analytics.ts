/**
 * Analytics utilities for tracking events
 */

// Google Analytics event tracking
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Analytics Event:", { action, category, label, value });
    }
  }
}

// Track booking events
export function trackBookingEvent(eventType: string, packageId?: string, value?: number) {
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
export function trackPaymentEvent(eventType: string, value?: number) {
  trackEvent(eventType, "Payment", undefined, value);
}

// Track purchase events
export function trackPurchase(packageName: string, value: number) {
  trackEvent("purchase", "Ecommerce", packageName, value);
}

// Track Facebook events
export function trackFacebookEvent(eventType: string, data?: any) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventType, data);
    
    if (process.env.NODE_ENV === "development") {
      console.log("Facebook Event:", { eventType, data });
    }
  }
}

// Track view item events
export function trackViewItem(itemId: string, itemName: string, value?: number) {
  trackEvent("view_item", "Ecommerce", itemName, value);
  
  // Also track for Facebook
  trackFacebookEvent("ViewContent", {
    content_ids: [itemId],
    content_type: "product",
    content_name: itemName,
    value: value,
    currency: "EUR"
  });
}

// Generic event function (alias for trackEvent)
export const event = trackEvent;