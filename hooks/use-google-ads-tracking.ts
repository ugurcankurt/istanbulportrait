"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook to capture Google Ads tracking parameters (GBRAID, WBRAID) from the URL
 * and store them in localStorage so they can be sent with a booking later.
 */
export function useGoogleAdsTracking() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;

    const gbraid = searchParams.get("gbraid");
    const wbraid = searchParams.get("wbraid");

    if (gbraid) {
      localStorage.setItem("google_ads_gbraid", gbraid);
    }

    if (wbraid) {
      localStorage.setItem("google_ads_wbraid", wbraid);
    }
  }, [searchParams]);

  return null;
}
