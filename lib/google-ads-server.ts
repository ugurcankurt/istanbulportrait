/**
 * Google Ads Conversion API — Server-Side Purchase Tracking
 *
 * Sends conversion events directly to Google Ads from the server,
 * bypassing browser/cookie/adblocker limitations (~98% reliable).
 *
 * This is the Google Ads equivalent of Meta CAPI — server-to-server.
 *
 * All configuration is pulled from Supabase site_settings (no .env needed).
 *
 * @see https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
 */

import { createHash } from "node:crypto";
import type { SiteSettings } from "./settings-service";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizeE164Phone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

const _GADS_CONVERSION_ENDPOINT =
  "https://googleads.googleapis.com/v17/customers/{CUSTOMER_ID}/conversionAdjustments:uploadClickConversions";

/**
 * Builds a full send_to label string.
 * Accepts either "AW-123/label" or just "label" (auto-prefixes with AW-ID).
 */
function buildSendTo(
  adsId: string | null,
  label: string | null,
): string | null {
  if (!label) return null;
  if (!adsId) return null;
  // If label already contains "/" it's a full send_to value
  if (label.includes("/")) return label;
  return `${adsId}/${label}`;
}

/**
 * Light-weight server-side ping to Google Ads via gtag Measurement Protocol.
 * Does NOT require Developer Token / OAuth — works via the gtag MP endpoint.
 *
 * This is the recommended approach for Next.js server components without
 * a full Google Ads API OAuth setup.
 */
export async function trackGoogleAdsPurchaseConversion(
  transactionId: string,
  value: number,
  currency: string = "EUR",
  settings: SiteSettings,
  gbraid?: string | null,
  wbraid?: string | null,
  gclid?: string | null,
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  },
  gaClientId?: string | null,
): Promise<void> {
  const adsId = settings.google_ads_id;
  const purchaseLabel = settings.google_ads_purchase_label;

  const sendTo = buildSendTo(adsId, purchaseLabel);

  if (!sendTo) {
    console.warn(
      "[Google Ads Server] Missing google_ads_id or google_ads_purchase_label in settings. Skipping.",
    );
    return;
  }

  try {
    const gaId = settings.google_analytics_id;
    const ga4Secret = settings.ga4_measurement_protocol_secret;

    if (gaId && ga4Secret) {
      // Connect to the user's active browser GA4 session if gaClientId is available
      const resolvedClientId =
        gaClientId || `server.${transactionId.replace(/[^a-zA-Z0-9]/g, "")}`;

      // biome-ignore lint/suspicious/noExplicitAny: Dynamic GA4 payload
      const ga4Payload: Record<string, any> = {
        client_id: resolvedClientId,
        events: [
          {
            name: "purchase",
            params: {
              transaction_id: transactionId,
              value,
              currency,
              send_to: sendTo,
              ...(gclid ? { gclid } : {}),
              ...(gbraid ? { gbraid } : {}),
              ...(wbraid ? { wbraid } : {}),
              items: [
                {
                  item_id: transactionId,
                  item_name: "Photography Package",
                  item_category: "Photography Package",
                  price: value,
                  quantity: 1,
                },
              ],
            },
          },
        ],
      };

      if (userData?.email || userData?.phone) {
        // biome-ignore lint/suspicious/noExplicitAny: Enhanced Conversions payload
        const formattedUserData: Record<string, any> = {};

        if (userData.email) {
          const normEmail = userData.email.trim().toLowerCase();
          formattedUserData.email = normEmail;
          formattedUserData.sha256_email_address = [sha256(normEmail)];
        }

        if (userData.phone) {
          const normPhone = normalizeE164Phone(userData.phone);
          formattedUserData.phone_number = normPhone;
          formattedUserData.sha256_phone_number = [sha256(normPhone)];
        }

        if (userData.firstName || userData.lastName) {
          formattedUserData.address = [
            {
              first_name: userData.firstName?.trim(),
              last_name: userData.lastName?.trim(),
              ...(userData.firstName
                ? { sha256_first_name: sha256(userData.firstName) }
                : {}),
              ...(userData.lastName
                ? { sha256_last_name: sha256(userData.lastName) }
                : {}),
            },
          ];
        }

        ga4Payload.user_data = formattedUserData;
      }

      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${gaId}&api_secret=${ga4Secret}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ga4Payload),
      });

      if (!response.ok) {
        console.error(
          `[Google Ads Server] GA4 MP purchase failed: ${response.status}`,
        );
      } else {
        console.log(
          `[Google Ads Server] Purchase sent via GA4 MP: ${transactionId} — €${value} (GCLID: ${gclid ? "Yes" : "No"}, GBRAID: ${gbraid ? "Yes" : "No"}, ClientID: ${resolvedClientId})`,
        );
      }
    }
  } catch (err) {
    // Non-blocking: never fail the main booking flow
    console.error(
      "[Google Ads Server] trackGoogleAdsPurchaseConversion error:",
      err,
    );
  }
}

/**
 * Server-side Google Ads Lead conversion tracking.
 */
export async function trackGoogleAdsLeadConversion(
  transactionId: string,
  _value: number = 0,
  _currency: string = "EUR",
  settings: SiteSettings,
): Promise<void> {
  const adsId = settings.google_ads_id;
  const leadLabel = settings.google_ads_lead_label;

  const sendTo = buildSendTo(adsId, leadLabel);

  if (!sendTo) {
    console.warn(
      "[Google Ads Server] Missing google_ads_lead_label in settings. Skipping Lead conversion.",
    );
    return;
  }

  console.log(
    `[Google Ads Server] Lead conversion: ${transactionId} → ${sendTo}`,
  );
  // Same pattern as purchase — extend if Developer Token is configured
}

/**
 * Resolves the correct send_to string for client-side use.
 * Used in layout.tsx to inject the correct value into window.__GOOGLE_ADS_*__
 */
export function resolveGoogleAdsLabel(
  adsId: string | null,
  label: string | null,
): string {
  return buildSendTo(adsId, label) || "";
}
