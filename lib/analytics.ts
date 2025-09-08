declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "consent",
      targetId: string,
      config?: Record<string, any>,
    ) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

export const event = (
  action: string,
  {
    event_category,
    event_label,
    value,
  }: {
    event_category?: string;
    event_label?: string;
    value?: number;
  },
) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("event", action, {
      event_category,
      event_label,
      value,
    });

    // Debug logging in development only
    if (process.env.NODE_ENV === "development") {
      console.log("Analytics Event:", {
        action,
        event_category,
        event_label,
        value,
        GA_TRACKING_ID,
      });
    }
  }
};

// Custom events for photography business
export const trackBookingEvent = (packageId: string, amount: number) => {
  event("booking_started", {
    event_category: "engagement",
    event_label: packageId,
    value: amount,
  });
};

export const trackPaymentEvent = (
  packageId: string,
  amount: number,
  status: "success" | "failure",
) => {
  event("payment_completed", {
    event_category: "ecommerce",
    event_label: `${packageId}_${status}`,
    value: status === "success" ? amount : 0,
  });
};

export const trackPackageView = (packageId: string) => {
  event("package_view", {
    event_category: "engagement",
    event_label: packageId,
  });
};

export const trackContactForm = () => {
  event("contact_form_submit", {
    event_category: "engagement",
    event_label: "contact_page",
  });
};

export const trackLanguageChange = (language: string) => {
  event("language_change", {
    event_category: "user_interaction",
    event_label: language,
  });
};

// Facebook Pixel integration functions
export const trackFacebookEvent = async (
  eventType: "Lead" | "Purchase" | "ViewContent" | "InitiateCheckout",
  customerData: {
    email?: string;
    phone?: string;
    packageId: string;
    amount: number;
    transactionId?: string;
  }
) => {
  try {
    // Validate that we have at least one customer identifier for the Conversions API
    if (!customerData.email && !customerData.phone) {
      console.warn(`Facebook ${eventType} Event: No customer identifiers provided, skipping Conversions API`);
      return { success: false, error: "No customer identifiers" };
    }

    // Send to our Facebook Conversions API endpoint
    const response = await fetch("/api/facebook/conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_name: eventType,
        customer_email: customerData.email || undefined,
        customer_phone: customerData.phone || undefined,
        package_id: customerData.packageId,
        amount: customerData.amount,
        transaction_id: customerData.transactionId || undefined,
      }),
    });

    const result = await response.json();

    if (process.env.NODE_ENV === "development") {
      console.log(`Facebook ${eventType} Event:`, result);
    }

    return result;
  } catch (error) {
    console.error(`Facebook ${eventType} tracking error:`, error);
    return { success: false, error };
  }
};

export const trackGalleryView = (imageId?: string) => {
  event("gallery_view", {
    event_category: "engagement",
    event_label: imageId || "gallery_page",
  });
};

// Enhanced Ecommerce Events for GA4
export const trackPurchase = (
  transactionId: string,
  packageId: string,
  amount: number,
) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    const eventData = {
      transaction_id: transactionId,
      value: amount,
      currency: "EUR",
      affiliation: "Istanbul Portrait",
      tax: 0,
      shipping: 0,
      items: [
        {
          item_id: packageId,
          item_name: `Photography Package - ${packageId}`,
          item_category: "Photography Services",
          item_brand: "Istanbul Portrait",
          item_variant: packageId,
          quantity: 1,
          price: amount,
        },
      ],
    };

    window.gtag("event", "purchase", eventData);

    // Debug logging in development only
    if (process.env.NODE_ENV === "development") {
      console.log("Enhanced Ecommerce - Purchase:", eventData);
    }
  }
};

export const trackBeginCheckout = (packageId: string, amount: number) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("event", "begin_checkout", {
      currency: "EUR",
      value: amount,
      items: [
        {
          item_id: packageId,
          item_name: `Photography Package - ${packageId}`,
          item_category: "Photography Services",
          item_brand: "Istanbul Portrait",
          item_variant: packageId,
          quantity: 1,
          price: amount,
        },
      ],
    });
  }
};

export const trackAddToCart = (packageId: string, amount: number) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("event", "add_to_cart", {
      currency: "EUR",
      value: amount,
      items: [
        {
          item_id: packageId,
          item_name: `Photography Package - ${packageId}`,
          item_category: "Photography Services",
          item_brand: "Istanbul Portrait",
          item_variant: packageId,
          quantity: 1,
          price: amount,
        },
      ],
    });
  }
};

export const trackViewItem = (packageId: string, amount: number) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("event", "view_item", {
      currency: "EUR",
      value: amount,
      items: [
        {
          item_id: packageId,
          item_name: `Photography Package - ${packageId}`,
          item_category: "Photography Services",
          item_brand: "Istanbul Portrait",
          item_variant: packageId,
          quantity: 1,
          price: amount,
        },
      ],
    });
  }
};
