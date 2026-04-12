"use server";

import { cookies } from "next/headers";

/**
 * Consent data structure stored in the cookie
 */
export interface ConsentData {
  consent: "accepted_all" | "essential_only";
  timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Cookie configuration
 */
const CONSENT_COOKIE_NAME = "user_consent";
const CONSENT_MAX_AGE = 365 * 24 * 60 * 60; // 12 months in seconds
const CONSENT_EXPIRATION_MS = 365 * 24 * 60 * 60 * 1000; // 12 months in milliseconds

/**
 * Sets the consent cookie with httpOnly and secure flags
 * @param consent - User's consent choice
 * @param timestamp - Timestamp when consent was given (defaults to now)
 */
export async function setConsentCookie(
  consent: "accepted_all" | "essential_only",
  timestamp?: number,
): Promise<void> {
  const consentData: ConsentData = {
    consent,
    timestamp: timestamp || Date.now(),
  };

  const cookieStore = await cookies();

  cookieStore.set(CONSENT_COOKIE_NAME, JSON.stringify(consentData), {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // CSRF protection
    maxAge: CONSENT_MAX_AGE,
    path: "/", // Available across entire site
  });
}

/**
 * Gets the consent cookie and validates it
 * @returns ConsentData if valid and not expired, null otherwise
 */
export async function getConsentCookie(): Promise<ConsentData | null> {
  const cookieStore = await cookies();
  const consentCookie = cookieStore.get(CONSENT_COOKIE_NAME);

  if (!consentCookie) {
    return null;
  }

  try {
    const consentData: ConsentData = JSON.parse(consentCookie.value);

    // Validate structure
    if (
      !consentData.consent ||
      !consentData.timestamp ||
      typeof consentData.timestamp !== "number"
    ) {
      console.warn("Invalid consent cookie structure, clearing cookie");
      await clearConsentCookie();
      return null;
    }

    // Validate consent value
    if (
      consentData.consent !== "accepted_all" &&
      consentData.consent !== "essential_only"
    ) {
      console.warn("Invalid consent value, clearing cookie");
      await clearConsentCookie();
      return null;
    }

    // Check expiration (12 months)
    const now = Date.now();
    const age = now - consentData.timestamp;

    if (age > CONSENT_EXPIRATION_MS) {
      // Consent expired (>12 months), clearing cookie
      await clearConsentCookie();
      return null;
    }

    return consentData;
  } catch (error) {
    console.error("Error parsing consent cookie:", error);
    await clearConsentCookie();
    return null;
  }
}

/**
 * Clears the consent cookie
 */
export async function clearConsentCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CONSENT_COOKIE_NAME);
}
