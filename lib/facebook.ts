import crypto from "crypto";

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
  return crypto.createHash("sha256").update(normalized).digest("hex");
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
  action_source: "system_generated" | "website";
  user_data: {
    em?: string[]; // hashed email
    ph?: string[]; // hashed phone
    lead_id?: number;
    fbc?: string; // Facebook click ID
    fbp?: string; // Facebook browser ID
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
  events: FacebookConversionEvent[]
): Promise<boolean> {
  if (!FACEBOOK_ACCESS_TOKEN || !FACEBOOK_DATASET_ID) {
    console.error("Facebook Conversions API: Missing access token or dataset ID");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${FACEBOOK_DATASET_ID}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: events,
          access_token: FACEBOOK_ACCESS_TOKEN,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Facebook Conversions API Error:", result);
      return false;
    }

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("Facebook Conversions API Success:", result);
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
  track: (eventName: string, parameters?: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fb = (window as any).fbq;
    if (fb) {
      fb("track", eventName, parameters);
      
      // Debug logging in development
      if (process.env.NODE_ENV === "development") {
        console.log("Facebook Pixel Event:", { eventName, parameters });
      }
    }
  },

  // Track ViewContent event
  trackViewContent: (contentId: string, value?: number) => {
    fbPixel.track("ViewContent", {
      content_ids: [contentId],
      content_type: "product",
      value: value,
      currency: "EUR",
    });
  },

  // Track Lead event
  trackLead: (value?: number) => {
    fbPixel.track("Lead", {
      value: value,
      currency: "EUR",
    });
  },

  // Track InitiateCheckout event
  trackInitiateCheckout: (contentId: string, value: number) => {
    fbPixel.track("InitiateCheckout", {
      content_ids: [contentId],
      content_type: "product",
      value: value,
      currency: "EUR",
    });
  },

  // Track Purchase event
  trackPurchase: (contentId: string, value: number, transactionId: string) => {
    fbPixel.track("Purchase", {
      content_ids: [contentId],
      content_type: "product",
      value: value,
      currency: "EUR",
      transaction_id: transactionId,
    });
  },
};

// Instagram Portrait specific tracking functions
export const trackFacebookLead = async (
  customerEmail: string,
  customerPhone: string,
  packageId: string,
  amount: number,
  leadId?: number
) => {
  const generatedLeadId = leadId || generateLeadId();

  // Prepare event for Conversions API
  const event: FacebookConversionEvent = {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "system_generated",
    user_data: {
      em: customerEmail ? [hashCustomerData(customerEmail)] : [],
      ph: customerPhone ? [hashPhoneNumber(customerPhone)] : [],
      lead_id: generatedLeadId,
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
  const success = await sendToFacebookConversionsAPI([event]);
  
  // Also track with client-side pixel
  fbPixel.trackLead(amount);

  return { success, leadId: generatedLeadId };
};

export const trackFacebookPurchase = async (
  customerEmail: string,
  customerPhone: string,
  packageId: string,
  amount: number,
  transactionId: string
) => {
  // Prepare event for Conversions API
  const event: FacebookConversionEvent = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "system_generated",
    user_data: {
      em: customerEmail ? [hashCustomerData(customerEmail)] : [],
      ph: customerPhone ? [hashPhoneNumber(customerPhone)] : [],
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
  const success = await sendToFacebookConversionsAPI([event]);
  
  // Also track with client-side pixel
  fbPixel.trackPurchase(packageId, amount, transactionId);

  return { success };
};

// Debug utilities for development
export const facebookDebug = {
  testHashing: () => {
    const email = "test@example.com";
    const phone = "+905551234567";
    
    console.log("Facebook Debug - Hash Testing:");
    console.log("Original email:", email);
    console.log("Hashed email:", hashCustomerData(email));
    console.log("Original phone:", phone);
    console.log("Hashed phone:", hashPhoneNumber(phone));
    console.log("Generated Lead ID:", generateLeadId());
  },

  testPixel: () => {
    if (typeof window === "undefined") {
      console.log("Facebook Debug: Window not available (server-side)");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fb = (window as any).fbq;
    if (fb) {
      console.log("Facebook Pixel: Loaded and ready");
      fbPixel.track("Test", { test: true });
    } else {
      console.log("Facebook Pixel: Not loaded");
    }
  },

  testConversionsAPI: async () => {
    const testEvent: FacebookConversionEvent = {
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "system_generated",
      user_data: {
        em: [hashCustomerData("test@example.com")],
        ph: [hashPhoneNumber("+905551234567")],
        lead_id: generateLeadId(),
      },
      custom_data: {
        event_source: "crm",
        lead_event_source: "Istanbul Portrait CRM Test",
        content_ids: ["premium"],
        value: 280,
        currency: "EUR",
      },
    };

    console.log("Testing Facebook Conversions API...");
    const success = await sendToFacebookConversionsAPI([testEvent]);
    console.log("Test result:", success ? "SUCCESS" : "FAILED");
  },
};