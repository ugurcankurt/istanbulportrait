"use client";

import Script from "next/script";

export function GoogleAnalytics({ gaId, adsId, userId }: { gaId?: string | null, adsId?: string | null, userId?: string | null }) {
  if (!gaId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        src={`/metrics/gtag/js?id=${gaId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__GA_ID = '${gaId}';
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Set First-Party Proxy globally for all events and configs
            gtag('set', 'transport_url', window.location.origin);
            
            ${userId ? `gtag('set', 'user_id', '${userId}');` : ''}
            
            gtag('config', '${gaId}'${userId ? `, { 'user_id': '${userId}' }` : ''});
          `,
        }}
      />
      {adsId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__ADS_ID = '${adsId}';
              gtag('config', '${adsId}', {
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
