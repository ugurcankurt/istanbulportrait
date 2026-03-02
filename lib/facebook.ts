import SHA256 from "crypto-js/sha256";

// Facebook/Meta Pixel Configuration
export const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
export const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
export const FACEBOOK_DATASET_ID = process.env.FACEBOOK_DATASET_ID;

// SHA256 hashing for customer data (required by Meta)
export function hashCustomerData(value: string): string {
  if (!value) return "";

  // Normalize the data before hashing
  const normalized = value.toLowerCase().trim();

  // Create SHA256 hash
  return SHA256(normalized).toString();
}

// Phone number normalization and hashing
export function hashPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // Add country code if not present (assume Turkey +90)
  const normalizedPhone = digitsOnly.startsWith("90")
    ? digitsOnly
    : `90${digitsOnly}`;

  return hashCustomerData(normalizedPhone);
}

// Generate Lead ID (15-17 digits as per Meta requirement)
export function generateLeadId(): number {
  // Generate a 15-digit number to avoid JavaScript integer precision issues
  const min = 100000000000000; // 15 digits
  const max = 999999999999999; // 15 digits
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Facebook Conversions API Event Interface
export interface FacebookConversionEvent {
  event_name: string;
  event_time: number;
  event_id?: string; // Critical for deduplication
  action_source: "system_generated" | "website";
  user_data: {
    em?: string[]; // hashed email
    ph?: string[]; // hashed phone
    lead_id?: number;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
    external_id?: string[]; // Unique external ID (hashed)
  };
  custom_data?: {
    event_source?: "crm" | "website";
    lead_event_source?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    transaction_id?: string;
  };
}

// Send event to Facebook Conversions API
export async function sendToFacebookConversionsAPI(
  events: FacebookConversionEvent[],
): Promise<boolean> {
  if (!FACEBOOK_ACCESS_TOKEN || !FACEBOOK_DATASET_ID) {
    console.error(
      "Facebook Conversions API: Missing access token or dataset ID",
    );
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${FACEBOOK_DATASET_ID}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: events,
          access_token: FACEBOOK_ACCESS_TOKEN,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Facebook Conversions API Error:", result);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Facebook Conversions API Network Error:", error);
    return false;
  }
}

// Client-side Facebook Pixel functions
export const fbPixel = {
  // Initialize Facebook Pixel
  init: (pixelId: string) => {
    if (typeof window === "undefined" || !pixelId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fb = (window as any).fbq;
    if (fb) {
      fb("init", pixelId);
      fb("track", "PageView");
    }
  },

  // Track custom events
  track: (
    eventName: string,
    parameters?: Record<string, unknown>,
    eventId?: string,
  ) => {
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fb = (window as any).fbq;
    if (fb) {
      if (eventId) {
        fb("track", eventName, parameters, { eventID: eventId });
      } else {
        fb("track", eventName, parameters);
      }
    }
  },

  // Track ViewContent event
  trackViewContent: (contentId: string, value?: number, eventId?: string) => {
    fbPixel.track(
      "ViewContent",
      {
        content_ids: [contentId],
        content_type: "product",
        value: value,
        currency: "EUR",
      },
      eventId,
    );
  },

  // Track Lead event
  trackLead: (value?: number, eventId?: string) => {
    fbPixel.track(
      "Lead",
      {
        value: value,
        currency: "EUR",
      },
      eventId,
    );
  },

  // Track InitiateCheckout event
  trackInitiateCheckout: (
    contentId: string,
    value: number,
    eventId?: string,
  ) => {
    fbPixel.track(
      "InitiateCheckout",
      {
        content_ids: [contentId],
        content_type: "product",
        value: value,
        currency: "EUR",
      },
      eventId,
    );
  },

  // Track Purchase event
  trackPurchase: (
    contentId: string,
    value: number,
    transactionId: string,
    eventId?: string,
  ) => {
    fbPixel.track(
      "Purchase",
      {
        content_ids: [contentId],
        content_type: "product",
        value: value,
        currency: "EUR",
        transaction_id: transactionId,
      },
      eventId,
    );
  },
};

export interface FacebookEventOptions {
  fbc?: string;
  fbp?: string;
  externalId?: string;
}

// Instagram Portrait specific tracking functions
export const trackFacebookLead = async (
  customerEmail: string,
  customerPhone: string,
  packageId: string,
  amount: number,
  leadId?: number,
  eventId?: string,
  options?: FacebookEventOptions,
) => {
  const generatedLeadId = leadId || generateLeadId();

  // Prepare event for Conversions API
  const event: FacebookConversionEvent = {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    user_data: {
      em: customerEmail ? [hashCustomerData(customerEmail)] : [],
      ph: customerPhone ? [hashPhoneNumber(customerPhone)] : [],
      lead_id: generatedLeadId,
      fbc: options?.fbc,
      fbp: options?.fbp,
      external_id: options?.externalId ? [options.externalId] : undefined,
    },
    custom_data: {
      event_source: "crm",
      lead_event_source: "Istanbul Portrait CRM",
      content_ids: [packageId],
      content_type: "photography_package",
      value: amount,
      currency: "EUR",
    },
  };

  // Send to Conversions API (server-side)
  // Only send CAPI if we have sufficient data or if it's critical
  // For leads, we might rely on client-side mostly, but CAPI helps
  const success = await sendToFacebookConversionsAPI([event]);

  // Client-side pixel should be called from the component, but if called here:
  if (typeof window !== "undefined") {
    fbPixel.trackLead(amount, eventId);
  }

  return { success, leadId: generatedLeadId };
};

export const trackFacebookPurchase = async (
  customerEmail: string,
  customerPhone: string,
  packageId: string,
  amount: number,
  transactionId: string,
  eventId?: string,
  options?: FacebookEventOptions,
) => {
  // Prepare event for Conversions API
  const event: FacebookConversionEvent = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    user_data: {
      em: customerEmail ? [hashCustomerData(customerEmail)] : [],
      ph: customerPhone ? [hashPhoneNumber(customerPhone)] : [],
      fbc: options?.fbc,
      fbp: options?.fbp,
      external_id: options?.externalId ? [options.externalId] : undefined,
    },
    custom_data: {
      event_source: "crm",
      lead_event_source: "Istanbul Portrait CRM",
      content_ids: [packageId],
      content_type: "photography_package",
      value: amount,
      currency: "EUR",
      transaction_id: transactionId,
    },
  };

  // Send to Conversions API (server-side)
  const success = await sendToFacebookConversionsAPI([event]);

  // Client-side pixel tracking logic is usually separate for Purchase
  // (e.g. on Thank You page), but if this function is called client-side:
  if (typeof window !== "undefined") {
    fbPixel.trackPurchase(packageId, amount, transactionId, eventId);
  }

  return { success };
};
