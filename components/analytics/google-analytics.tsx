"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

export function GoogleAnalytics({ gaId, adsId }: { gaId?: string | null, adsId?: string | null }) {
  if (!gaId) {
    return null;
  }

  return (
    <>
      <NextGoogleAnalytics gaId={gaId} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__GA_ID = '${gaId}';`,
        }}
      />
      {adsId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__ADS_ID = '${adsId}';
              window.gtag('config', '${adsId}', {
                'allow_enhanced_conversions': true
              });
            `,
          }}
        />
      )}
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
