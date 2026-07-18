/**
 * Turinvoice Payment Gateway Client
 *
 * Integration with Turinvoice payment system for Russian customers.
 * Supports order creation, status polling, QR code generation, and refunds.
 * Note: Turinvoice only supports TRY currency, so EUR amounts are converted.
 */

import { convertEURtoTRY, getEURtoTRYRate } from "./currency";
import { settingsService } from "./settings-service";

// Turinvoice API Configuration
// Dynamically fetched per request now

// Types
export interface TurinvoiceLoginResponse {
  code: string;
  sessionId?: string;
}

export interface TurinvoiceOrderRequest {
  idTSP: number;
  amount: number;
  name: string;
  currency: string;
  quantity: number;
  callbackUrl: string;
  redirectURL?: string;
}

export interface TurinvoiceOrder {
  id: number;
  amount: number;
  amountEUR?: number; // Original EUR amount for reference
  exchangeRate?: number; // EUR/TRY rate used for conversion
  currency: string;
  number: number;
  name: string;
  quantity: number;
  state: "new" | "paying" | "paid";
  dateCreate: string;
  payment: any;
  calculationState: any;
  datePay: string | null;
  linkReceipt: string | null;
  futurePayout: boolean;
  datePayout: string | null;
  paymentUrl: string;
  refund: any[];
}

export interface TurinvoiceRefundRequest {
  idOrder: number;
  amount?: number;
  description?: string;
}

export interface TurinvoiceRefundResponse {
  idRefund?: number;
  code: string;
  message: {
    RU: string;
    TR: string;
  };
}

/**
 * Login to Turinvoice and get session ID
 * @returns Session ID cookie value
 */
export async function turinvoiceLogin(): Promise<string> {
  try {
    const settings = await settingsService.getSettings();
    if (!settings.turinvoice_base_url || !settings.turinvoice_login || !settings.turinvoice_password) {
      throw new Error("Turinvoice base url, login or password not configured in admin settings");
    }

    const response = await fetch(`${settings.turinvoice_base_url}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login: settings.turinvoice_login,
        password: settings.turinvoice_password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Turinvoice login failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "OK") {
      throw new Error(`Turinvoice login error: ${data.code}`);
    }

    // Extract sessionid from Set-Cookie header
    const setCookie = response.headers.get("set-cookie");
    if (!setCookie) {
      throw new Error("No session cookie received from Turinvoice");
    }

    const sessionMatch = setCookie.match(/sessionid=([^;]+)/);
    if (!sessionMatch) {
      throw new Error("Could not extract session ID from cookie");
    }

    return sessionMatch[1];
  } catch (error) {
    console.error("Turinvoice login error:", error);
    throw new Error(
      `Failed to authenticate with Turinvoice: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Create a new order in Turinvoice
 * Note: Converts EUR to TRY as Turinvoice only supports TRY currency
 * @param amountEUR Amount in EUR (will be converted to TRY)
 * @param orderName Order description
 * @param redirectURL Optional redirect URL after payment
 * @returns Created order details with both TRY and original EUR amounts
 */
export async function turinvoiceCreateOrder(
  amountEUR: number,
  orderName: string,
  redirectURL?: string,
): Promise<TurinvoiceOrder> {
  try {
    const settings = await settingsService.getSettings();
    if (!settings.turinvoice_id_tsp || !settings.turinvoice_callback_url) {
      throw new Error("Turinvoice ID TSP or Callback URL missing in settings");
    }
    // Convert EUR to TRY
    const exchangeRate = await getEURtoTRYRate();
    const amountTRY = await convertEURtoTRY(amountEUR);

    // Login first to get session
    const sessionId = await turinvoiceLogin();

    const orderRequest: TurinvoiceOrderRequest = {
      idTSP: Number.parseInt(settings.turinvoice_id_tsp),
      amount: amountTRY,
      name: orderName,
      currency: "TRY",
      quantity: 1,
      callbackUrl: settings.turinvoice_callback_url,
      ...(redirectURL && { redirectURL }),
    };

    const response = await fetch(`${settings.turinvoice_base_url}/api/v1/tsp/order`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionid=${sessionId}`,
      },
      body: JSON.stringify(orderRequest),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Turinvoice session expired, please retry");
      }
      // Log detailed error response for debugging
      const errorBody = await response.text();
      console.error("Turinvoice order creation failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
        requestPayload: orderRequest,
      });
      throw new Error(
        `Turinvoice order creation failed: ${response.status} - ${errorBody}`,
      );
    }

    const data = await response.json();

    if (!data.idOrder) {
      throw new Error("No order ID received from Turinvoice");
    }

    // Get full order details and add EUR conversion info
    const order = await turinvoiceGetOrderStatus(data.idOrder, sessionId);
    return {
      ...order,
      amountEUR,
      exchangeRate,
    };
  } catch (error) {
    console.error("Turinvoice order creation error:", error);
    throw new Error(
      `Failed to create Turinvoice order: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get order status from Turinvoice
 * @param idOrder Order ID
 * @param sessionId Optional session ID (will login if not provided)
 * @returns Order details with current status
 */
export async function turinvoiceGetOrderStatus(
  idOrder: number,
  sessionId?: string,
): Promise<TurinvoiceOrder> {
  try {
    const settings = await settingsService.getSettings();
    // Login if no session provided
    const session = sessionId || (await turinvoiceLogin());

    const response = await fetch(
      `${settings.turinvoice_base_url}/api/v1/tsp/order?idOrder=${idOrder}`,
      {
        method: "GET",
        headers: {
          Cookie: `sessionid=${session}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Turinvoice session expired");
      }
      throw new Error(`Turinvoice status check failed: ${response.status}`);
    }

    const data = await response.json();

    // Fix payment URL domain from .com to .ru as requested
    if (data.paymentUrl) {
      data.paymentUrl = data.paymentUrl.replace(
        "turinvoice.com",
        "turinvoice.ru",
      );
    }

    return data as TurinvoiceOrder;
  } catch (error) {
    console.error("Turinvoice status check error:", error);
    throw new Error(
      `Failed to get Turinvoice order status: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get QR code for order payment
 * @param idOrder Order ID
 * @param sessionId Optional session ID (will login if not provided)
 * @returns QR code image as Blob
 */
export async function turinvoiceGetQRCode(
  idOrder: number,
  sessionId?: string,
): Promise<Blob> {
  try {
    const settings = await settingsService.getSettings();
    // Login if no session provided
    const session = sessionId || (await turinvoiceLogin());

    const response = await fetch(
      `${settings.turinvoice_base_url}/api/v1/tsp/order/payment/qr?idOrder=${idOrder}`,
      {
        method: "GET",
        headers: {
          Cookie: `sessionid=${session}`,
        },
      },
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Turinvoice session expired");
      }
      throw new Error(
        `Turinvoice QR code generation failed: ${response.status}`,
      );
    }

    return await response.blob();
  } catch (error) {
    console.error("Turinvoice QR code error:", error);
    throw new Error(
      `Failed to get Turinvoice QR code: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Refund a payment
 * @param idOrder Order ID to refund
 * @param amount Optional partial refund amount (in RUB)
 * @param description Optional refund description
 * @returns Refund result
 */
export async function turinvoiceRefund(
  idOrder: number,
  amount?: number,
  description?: string,
): Promise<TurinvoiceRefundResponse> {
  try {
    const settings = await settingsService.getSettings();
    // Login first to get session
    const sessionId = await turinvoiceLogin();

    const refundRequest: TurinvoiceRefundRequest = {
      idOrder,
      ...(amount && { amount }),
      ...(description && { description }),
    };

    const response = await fetch(`${settings.turinvoice_base_url}/api/v1/tsp/refund`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `sessionid=${sessionId}`,
      },
      body: JSON.stringify(refundRequest),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Turinvoice session expired");
      }
      throw new Error(`Turinvoice refund failed: ${response.status}`);
    }

    const data = await response.json();
    return data as TurinvoiceRefundResponse;
  } catch (error) {
    console.error("Turinvoice refund error:", error);
    throw new Error(
      `Failed to process Turinvoice refund: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Verify webhook secret key
 * @param secretKey Secret key from webhook payload
 * @returns True if valid
 */
export async function turinvoiceVerifyWebhook(secretKey: string): Promise<boolean> {
  const settings = await settingsService.getSettings();
  return secretKey === settings.turinvoice_secret_key;
}
