import crypto from "node:crypto";

import type { SiteSettings } from "./settings-service";

export interface PaymentRequest {
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  locale?: string;
  paymentCard: {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
  };
  buyer: {
    id: string;
    name: string;
    surname: string;
    gsmNumber: string;
    email: string;
    identityNumber: string;
    registrationAddress: string;
    ip: string;
    city: string;
    country: string;
  };
  shippingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  billingAddress: {
    contactName: string;
    city: string;
    country: string;
    address: string;
  };
  basketItems: Array<{
    id: string;
    name: string;
    category1: string;
    itemType: string;
    price: string;
  }>;
}

// Generate Iyzico IYZWSv2 authorization header with proper HMACSHA256
function generateAuthString(
  request: any,
  randomString: string,
  settings: SiteSettings,
  uriPath: string = "/payment/auth",
): string {
  try {
    const API_KEY = settings.iyzico_api_key;
    const SECRET_KEY = settings.iyzico_secret_key;
    
    if (!API_KEY || !SECRET_KEY) {
      throw new Error("Iyzico API keys are not configured in admin settings");
    }
    // Convert request to JSON string
    const requestBody = JSON.stringify(request);

    // Create payload: randomKey + uriPath + requestBody
    const payload = randomString + uriPath + requestBody;

    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(payload, "utf8")
      .digest("hex");

    // Create authorization string format: apiKey:{apiKey}&randomKey:{randomKey}&signature:{signature}
    const authString = `apiKey:${API_KEY}&randomKey:${randomString}&signature:${signature}`;

    // Encode to Base64
    const base64Auth = Buffer.from(authString, "utf8").toString("base64");

    if (process.env.NODE_ENV === "development") {
    }

    return base64Auth;
  } catch (error) {
    console.error("Iyzico: Signature generation error:", error);
    throw new Error("Failed to generate authentication signature");
  }
}

// Real Iyzico payment processing
export const initializePayment = async (
  paymentRequest: PaymentRequest,
  settings: SiteSettings
): Promise<any> => {
  try {
    const IYZICO_BASE_URL = settings.iyzico_base_url || "https://api.iyzipay.com";
    const API_KEY = settings.iyzico_api_key;
    const SECRET_KEY = settings.iyzico_secret_key;

    // Check if we have valid API keys
    if (!API_KEY || !SECRET_KEY) {
      console.error("Error: Iyzico API keys not configured in Admin Settings.");
      return {
        status: "failure",
        paymentId: null,
        conversationId: paymentRequest.conversationId,
        errorCode: "CONFIG_ERROR",
        errorMessage: "Payment Gateway is not configured. Please contact the administrator.",
      };
    }

    // Make actual API call to Iyzico
    const randomString = Date.now().toString();

    try {
      const authString = generateAuthString(
        paymentRequest,
        randomString,
        settings,
        "/payment/auth",
      );

      if (process.env.NODE_ENV === "development") {
      }

      const response = await fetch(`${IYZICO_BASE_URL}/payment/auth`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `IYZWSv2 ${authString}`,
          "x-iyzi-rnd": randomString,
        },
        body: JSON.stringify(paymentRequest),
      });

      const result = await response.json();

      return result;
    } catch (apiError) {
      console.error("Iyzico API Call Failed:", apiError);
      throw new Error("Payment API call failed");
    }
  } catch (error) {
    console.error("Iyzico: Payment initialization error:", error);
    throw new Error("Payment processing failed");
  }
};



export const retrievePayment = async (
  conversationId: string,
  token: string,
  settings: SiteSettings
): Promise<any> => {
  try {
    const IYZICO_BASE_URL = settings.iyzico_base_url || "https://api.iyzipay.com";
    const API_KEY = settings.iyzico_api_key;
    
    if (!API_KEY) {
      throw new Error("Iyzico API key is not configured in admin settings");
    }

    const request = { conversationId, token };
    const randomString = Date.now().toString();
    const authString = generateAuthString(request, randomString, settings, "/payment/detail");

    const response = await fetch(`${IYZICO_BASE_URL}/payment/detail`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `IYZWS ${API_KEY}:${authString}`,
        "x-iyzi-rnd": randomString,
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Payment retrieval error:", error);
    throw new Error("Payment retrieval failed");
  }
};
