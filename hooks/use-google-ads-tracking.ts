"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Cookie helper for setting attribution identifiers (90 days expiry)
 */
function setCookie(name: string, value: string, days = 90) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  // biome-ignore lint/suspicious/noDocumentCookie: Client-side attribution cookie fallback
  document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

/**
 * Helper to retrieve Google Ads attribution identifiers from cookie or localStorage
 */
export function getGoogleAdsClickIdentifiers(): {
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
} {
  if (typeof window === "undefined") {
    return { gclid: null, gbraid: null, wbraid: null };
  }

  const gclid =
    getCookie("gads_gclid") || localStorage.getItem("google_ads_gclid") || null;
  const gbraid =
    getCookie("gads_gbraid") ||
    localStorage.getItem("google_ads_gbraid") ||
    null;
  const wbraid =
    getCookie("gads_wbraid") ||
    localStorage.getItem("google_ads_wbraid") ||
    null;

  return { gclid, gbraid, wbraid };
}

/**
 * Hook to capture Google Ads tracking parameters (GCLID, GBRAID, WBRAID) from the URL
 * and store them in both 90-day cookies and localStorage for full attribution.
 */
export function useGoogleAdsTracking() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const gclid = searchParams.get("gclid");
    const gbraid = searchParams.get("gbraid");
    const wbraid = searchParams.get("wbraid");
    const gadSource = searchParams.get("gad_source");

    if (gclid) {
      localStorage.setItem("google_ads_gclid", gclid);
      setCookie("gads_gclid", gclid);
      // Also set standard Google Ads _gcl_aw cookie compatibility if needed
      setCookie("_gcl_aw", `GCL.${Date.now()}.${gclid}`);
    }

    if (gbraid) {
      localStorage.setItem("google_ads_gbraid", gbraid);
      setCookie("gads_gbraid", gbraid);
    }

    if (wbraid) {
      localStorage.setItem("google_ads_wbraid", wbraid);
      setCookie("gads_wbraid", wbraid);
    }

    if (gadSource) {
      localStorage.setItem("google_ads_gad_source", gadSource);
      setCookie("gads_gad_source", gadSource);
    }
  }, [searchParams]);

  return null;
}
