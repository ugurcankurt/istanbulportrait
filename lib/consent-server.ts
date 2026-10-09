import type { NextRequest } from "next/server";

/**
 * Reads the httpOnly `user_consent` cookie (see app/actions/consent.ts)
 * inside Route Handlers. Server-side marketing APIs (Meta CAPI, GA4 MP ad
 * signals) must only receive user data when the visitor accepted all cookies.
 */
export function hasMarketingConsent(request: NextRequest): boolean {
  const raw = request.cookies.get("user_consent")?.value;
  if (!raw) return false;
  try {
    const data = JSON.parse(raw) as { consent?: string };
    return data.consent === "accepted_all";
  } catch {
    return false;
  }
}
