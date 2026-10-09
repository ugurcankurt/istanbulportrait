"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { useConsent } from "@/contexts/consent-context";

export function GoogleAnalytics({
  gaId,
  userId,
}: {
  gaId?: string | null;
  userId?: string | null;
}) {
  const { consent, isLoading } = useConsent();
  const lastSetUserId = useRef<string | null>(null);

  // Keep GA4 user_id in sync on the client (login/logout via router.refresh,
  // consent changes). The initial value is already set server-side in the
  // layout bootstrap script, before gtag.js config, so page_view carries it.
  useEffect(() => {
    if (isLoading || typeof window === "undefined" || !window.gtag) return;

    const effectiveId = consent === "accepted_all" && userId ? userId : null;

    if (effectiveId) {
      if (lastSetUserId.current !== effectiveId) {
        window.gtag("set", { user_id: effectiveId } as any);
        lastSetUserId.current = effectiveId;
      }
    } else if (lastSetUserId.current) {
      // Logged out or consent withdrawn: stop attaching the identifier
      window.gtag("set", { user_id: null } as any);
      lastSetUserId.current = null;
    }
  }, [userId, consent, isLoading]);

  if (!gaId) {
    return null;
  }

  return (
    <>
      <NextGoogleAnalytics gaId={gaId} />
      <Script
        id="google-analytics-custom-config"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){ (window.dataLayer = window.dataLayer || []).push(arguments); };
            
            window.gtag('set', 'allow_enhanced_conversions', true);
            window.gtag('config', 'AW-1007335227');
          `,
        }}
      />
    </>
  );
}

export function GoogleAnalyticsConsentUpdate(granted: boolean) {
  if (typeof window !== "undefined" && window.gtag) {
    if (granted) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    } else {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  }
}
