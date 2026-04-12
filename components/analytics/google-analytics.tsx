"use client";

import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

export function GoogleAnalytics({ gaId }: { gaId?: string | null }) {
  if (!gaId) {
    return null;
  }

  return (
    <>
      <NextGoogleAnalytics gaId={gaId} />
      {ADS_ID && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.gtag('config', '${ADS_ID}', {
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
