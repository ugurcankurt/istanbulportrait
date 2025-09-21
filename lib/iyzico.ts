import crypto from "node:crypto";

// Iyzico API endpoint URLs
const IYZICO_BASE_URL =
  process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";
const API_KEY = process.env.IYZICO_API_KEY || "demo-api-key";
const SECRET_KEY = process.env.IYZICO_SECRET_KEY || "demo-secret-key";

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
  uriPath: string = "/payment/auth",
): string {
  try {
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

// Real Iyzico payment processing with demo mode fallback
export const initializePayment = async (
  paymentRequest: PaymentRequest,
): Promise<any> => {
  try {
    // Check if we have valid API keys
    if (
      !API_KEY ||
      API_KEY === "demo-api-key" ||
      !SECRET_KEY ||
      SECRET_KEY === "demo-secret-key"
    ) {
      console.warn("Warning: Using demo mode - Iyzico API keys not configured");
      return createDemoPaymentResponse(paymentRequest);
    }

    // Make actual API call to Iyzico
    const randomString = Date.now().toString();

    try {
      const authString = generateAuthString(
        paymentRequest,
        randomString,
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
      // Iyzico API call failed - fallback to demo mode
      return createDemoPaymentResponse(paymentRequest);
    }
  } catch (error) {
    console.error("Iyzico: Payment initialization error:", error);
    throw new Error("Payment processing failed");
  }
};

// Demo payment response generator for testing
function createDemoPaymentResponse(paymentRequest: PaymentRequest) {
  const isTestCard =
    paymentRequest.paymentCard.cardNumber === "5528790000000008";

  if (isTestCard) {
    // Simulate successful payment for test card
    return {
      status: "success",
      paymentId: `demo_${Date.now()}`,
      conversationId: paymentRequest.conversationId,
      price: paymentRequest.price,
      currency: paymentRequest.currency,
      systemTime: Date.now(),
      errorCode: null,
      errorMessage: null,
    };
  } else {
    // Simulate payment failure for other cards in demo mode
    return {
      status: "failure",
      paymentId: null,
      conversationId: paymentRequest.conversationId,
      errorCode: "DEMO_INVALID_CARD",
      errorMessage:
        "Demo mode: Use test card 5528790000000008 for successful payment",
    };
  }
}

export const retrievePayment = async (
  conversationId: string,
  token: string,
): Promise<any> => {
  try {
    const request = { conversationId, token };
    const randomString = Date.now().toString();
    const authString = generateAuthString(request, randomString);

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
