// Global type declarations for Istanbul Portrait

// GA4 Ecommerce Item Interface
interface GA4Item {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
}

// GA4 Event Parameters
interface GA4EventParams {
  // Page tracking
  page_location?: string;
  page_title?: string;

  // Legacy Universal Analytics (deprecated but kept for backward compatibility)
  event_category?: string;
  event_label?: string;

  // GA4 Ecommerce parameters
  transaction_id?: string;
  currency?: string;
  value?: number;
  items?: GA4Item[];
  payment_type?: string;

  // General
  non_interaction?: boolean;
  [key: string]: unknown;
}

declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js" | "consent" | "set",
      targetId: string | Date,
      config?: GA4EventParams,
    ) => void;

    fbq: (
      command: "track" | "trackCustom" | "init" | "consent",
      eventName: string,
      parameters?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;

    _fbq: typeof window.fbq;

    dataLayer: Record<string, unknown>[];
  }
}

export { };
