import { settingsService } from "./settings-service";

// SHA256 hashing for customer data (required by Meta/Facebook)
// Uses native Web Crypto API (crypto.subtle) which is built-in and saves bundle size.
export async function hashCustomerData(value: string): Promise<string> {
  if (!value) return "";

  // Normalize the data before hashing
  const normalized = value.toLowerCase().trim();

  // For both Browser and Node.js 19+ environment
  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

// Phone number normalization and hashing
export async function hashPhoneNumber(phone: string): Promise<string> {
  if (!phone) return "";

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  // Add country code if not present (assume Turkey +90)
  const normalizedPhone = digitsOnly.startsWith("90")
    ? digitsOnly
    : `90${digitsOnly}`;

  return await hashCustomerData(normalizedPhone);
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
  event_source_url?: string; // URL where the event took place
  action_source: "system_generated" | "website";
  user_data: {
    em?: string[]; // hashed email
    ph?: string[]; // hashed phone
    fn?: string[]; // hashed first name
    ln?: string[]; // hashed last name
    ct?: string[]; // hashed city
    st?: string[]; // hashed state
    zp?: string[]; // hashed zip
    country?: string[]; // hashed country
    db?: string[]; // hashed dob (YYYYMMDD)
    ge?: string[]; // hashed gender (m or f)
    lead_id?: number;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
    external_id?: string[]; // Unique external ID (hashed)
    client_ip_address?: string; // Required when em/ph is missing
    client_user_agent?: string; // Required when em/ph is missing
  };
  custom_data?: {
    event_source?: "crm" | "website";
    lead_event_source?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    transaction_id?: string;
    num_items?: number;
  };
}

// Send event to Facebook Conversions API
// Returns true on success, or error string on failure
export async function sendToFacebookConversionsAPI(
  events: FacebookConversionEvent[],
): Promise<boolean | string> {
  const settings = await settingsService.getSettings();
  const FACEBOOK_ACCESS_TOKEN = settings.facebook_access_token;
  const FACEBOOK_DATASET_ID = settings.facebook_dataset_id;

  if (!FACEBOOK_ACCESS_TOKEN || !FACEBOOK_DATASET_ID) {
    const msg =
      "Facebook Conversions API: Missing FACEBOOK_ACCESS_TOKEN or FACEBOOK_DATASET_ID in admin settings";
    console.error(msg);
    return msg;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v25.0/${FACEBOOK_DATASET_ID}/events`,
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
      // Return full error object for debugging
      const errDetail = JSON.stringify(result?.error || result);
      console.error("Facebook Conversions API Error:", errDetail);
      return errDetail;
    }

    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Network error";
    console.error("Facebook Conversions API Network Error:", errMsg);
    return errMsg;
  }
}

// Client-side Facebook Pixel functions
export const fbPixel = {
  // Initialize Facebook Pixel
  init: (pixelId: string, userData?: Record<string, string>) => {
    if (typeof window === "undefined" || !pixelId) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fb = (window as any).fbq;
    if (fb) {
      if (userData) {
        fb("init", pixelId, userData);
      } else {
        fb("init", pixelId);
      }
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
  clientIpAddress?: string;
  clientUserAgent?: string;
  eventSourceUrl?: string;
}

// Istanbul Portrait specific tracking functions
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

  // Prepare hashed data
  const hashedEmail = customerEmail ? [await hashCustomerData(customerEmail)] : [];
  const hashedPhone = customerPhone ? [await hashPhoneNumber(customerPhone)] : [];

  // Prepare event for Conversions API
  const event: FacebookConversionEvent = {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    action_source: "system_generated",
    user_data: {
      em: hashedEmail,
      ph: hashedPhone,
      lead_id: generatedLeadId,
      fbc: options?.fbc,
      fbp: options?.fbp,
      external_id: options?.externalId ? [options.externalId] : undefined,
    },
    custom_data: {
      event_source: "crm",
      lead_event_source: "Istanbul Portrait CRM",
      content_ids: [packageId],
      content_type: "product",
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
  // Prepare hashed data
  const hashedEmail = customerEmail ? [await hashCustomerData(customerEmail)] : [];
  const hashedPhone = customerPhone ? [await hashPhoneNumber(customerPhone)] : [];

  // Prepare event for Conversions API
  const event: FacebookConversionEvent = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    action_source: "system_generated",
    user_data: {
      em: hashedEmail,
      ph: hashedPhone,
      fbc: options?.fbc,
      fbp: options?.fbp,
      external_id: options?.externalId ? [options.externalId] : undefined,
    },
    custom_data: {
      event_source: "crm",
      lead_event_source: "Istanbul Portrait CRM",
      content_ids: [packageId],
      content_type: "product",
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

export const trackFacebookPrintPurchase = async (
  customerEmail: string,
  customerPhone: string,
  items: Array<{ sku: string; price: number; quantity: number }>,
  totalAmount: number,
  transactionId: string,
  eventId?: string,
  options?: FacebookEventOptions,
) => {
  // Aggregate content IDs
  const contentIds = items.map((item) => item.sku);

  // Prepare hashed data
  const hashedEmail = customerEmail ? [await hashCustomerData(customerEmail)] : [];
  const hashedPhone = customerPhone ? [await hashPhoneNumber(customerPhone)] : [];

  // Prepare event for Conversions API
  const event: FacebookConversionEvent = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: options?.eventSourceUrl,
    action_source: "website", // Or system_generated
    user_data: {
      em: hashedEmail,
      ph: hashedPhone,
      fbc: options?.fbc,
      fbp: options?.fbp,
      client_ip_address: options?.clientIpAddress,
      client_user_agent: options?.clientUserAgent,
      external_id: options?.externalId ? [options.externalId] : undefined,
    },
    custom_data: {
      event_source: "website",
      content_ids: contentIds,
      content_type: "product",
      value: totalAmount,
      currency: "EUR",
      transaction_id: transactionId,
      num_items: items.reduce((acc, curr) => acc + curr.quantity, 0),
    },
  };

  // Send to Conversions API
  const success = await sendToFacebookConversionsAPI([event]);
  return { success };
};

/**
 * Tracks a Meta CRM Lead event — fires automatically on every confirmed booking.
 */
export const trackMetaCRMLeadEvent = async (
  customerEmail: string,
  customerPhone: string,
  bookingId: string,
  eventId?: string,
  options?: FacebookEventOptions,
): Promise<void> => {
  try {
    // Derive a stable 15-digit lead_id from bookingId
    const leadId =
      (Math.abs(
        bookingId
          .split("")
          .reduce((acc, ch) => acc + ch.charCodeAt(0), 100000000000000),
      ) %
        900000000000000) +
      100000000000000;

    const cleanId = bookingId.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Prepare hashed data
    const hashedEmail = customerEmail ? [await hashCustomerData(customerEmail)] : [];
    const hashedPhone = customerPhone ? [await hashPhoneNumber(customerPhone)] : [];

    const event: FacebookConversionEvent = {
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId || `crm_auto_${cleanId}_${Date.now()}`,
      event_source_url: options?.eventSourceUrl,
      action_source: "system_generated",
      user_data: {
        em: hashedEmail,
        ph: hashedPhone,
        lead_id: leadId,
      },
      custom_data: {
        event_source: "crm",
        lead_event_source: "Istanbul Portrait CRM",
      },
    };

    await sendToFacebookConversionsAPI([event]);
  } catch (err) {
    // Non-blocking: log error but never throw
    console.error("[Meta CRM] trackMetaCRMLeadEvent failed:", err);
  }
};
