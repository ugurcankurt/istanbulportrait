/**
 * GA4 Measurement Protocol — Server-Side Purchase Tracking
 *
 * Sends purchase events directly to Google Analytics from the server,
 * bypassing browser/cookie/adblocker limitations (100% reliable).
 *
 * This is the GA4 equivalent of Meta CAPI — server-to-server tracking.
 *
 * Required env vars:
 *   NEXT_PUBLIC_GOOGLE_ANALYTICS_ID  = G-XXXXXXXXXX
 *   GA4_MEASUREMENT_PROTOCOL_SECRET  = your API secret from GA4 Admin
 *
 * @see https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
const GA4_API_SECRET = process.env.GA4_MEASUREMENT_PROTOCOL_SECRET;

const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

interface GA4Item {
    item_id: string;
    item_name: string;
    item_category?: string;
    price: number;
    quantity: number;
}

interface GA4PurchaseParams {
    transaction_id: string;
    value: number;
    currency?: string;
    items: GA4Item[];
}

/**
 * Send a server-side Purchase event to GA4 via Measurement Protocol.
 * Non-blocking: catches all errors, never throws.
 */
export async function trackGA4ServerPurchase(
    bookingId: string,
    packageId: string,
    packageName: string,
    totalAmount: number,
    currency: string = "EUR",
    clientId?: string, // Optional: GA4 client_id from cookie (_ga)
): Promise<void> {
    if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
        console.warn("[GA4 Server] Missing NEXT_PUBLIC_GOOGLE_ANALYTICS_ID or GA4_MEASUREMENT_PROTOCOL_SECRET");
        return;
    }

    // GA4 requires a client_id — use booking ID as fallback if not available
    const resolvedClientId = clientId || `server.${bookingId.replace(/[^a-zA-Z0-9]/g, "")}`;

    const payload = {
        client_id: resolvedClientId,
        events: [
            {
                name: "purchase",
                params: {
                    transaction_id: bookingId,
                    value: totalAmount,
                    currency: currency,
                    items: [
                        {
                            item_id: packageId,
                            item_name: packageName,
                            item_category: "Photography Package",
                            price: totalAmount,
                            quantity: 1,
                        },
                    ],
                },
            },
        ],
    };

    try {
        const url = `${GA4_ENDPOINT}?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`[GA4 Server] Purchase event failed: ${response.status} ${response.statusText}`);
        } else {
            console.log(`[GA4 Server] Purchase event sent: ${bookingId} — €${totalAmount}`);
        }
    } catch (err) {
        // Non-blocking: never fail the main flow
        console.error("[GA4 Server] trackGA4ServerPurchase error:", err);
    }
}

/**
 * Package display names (for GA4 item_name)
 */
export const PACKAGE_DISPLAY_NAMES: Record<string, string> = {
    essential: "Classic Istanbul Portrait",
    premium: "Istanbul Discovery Photoshoot",
    luxury: "Bosphorus Luxury Collection",
    rooftop: "Flying Dress Rooftop",
};
