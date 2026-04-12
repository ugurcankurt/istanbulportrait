"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "@/contexts/consent-context";
import { getUserDataForAdvancedMatching } from "@/lib/analytics";
import { FACEBOOK_PIXEL_ID, hashCustomerData, hashPhoneNumber } from "@/lib/facebook";

export function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent } = useConsent();

  // Sync Meta Consent Mode whenever user makes a choice
  // Must run AFTER fbq is initialized (afterInteractive Script has loaded)
  useEffect(() => {
    if (typeof window === "undefined" || !window.fbq) return;

    if (consent === "accepted_all") {
      // Full consent — allow personalized ads & tracking
      window.fbq("consent", "grant");
    } else {
      // 'essential_only' or null (not yet chosen) — revoke ad tracking
      window.fbq("consent", "revoke");
    }
  }, [consent]);

  // Track PageView on every route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: Track page views on route change
  useEffect(() => {
    const initPixelWithAdvancedMatching = async () => {
      if (!FACEBOOK_PIXEL_ID || typeof window === "undefined" || !window.fbq) return;

      // Check for persisted user data and re-init with it for Advanced Matching
      const userData = getUserDataForAdvancedMatching();
      if (userData) {
        const hashed: Record<string, string> = {};
        if (userData.email) hashed.em = await hashCustomerData(userData.email);
        if (userData.phone) hashed.ph = await hashPhoneNumber(userData.phone);
        if (userData.firstName) hashed.fn = await hashCustomerData(userData.firstName);
        if (userData.lastName) hashed.ln = await hashCustomerData(userData.lastName);
        if (userData.country) hashed.country = await hashCustomerData(userData.country);

        if (Object.keys(hashed).length > 0) {
          window.fbq("init", FACEBOOK_PIXEL_ID, hashed);
        }
      }

      window.fbq("track", "PageView");
    };

    initPixelWithAdvancedMatching();
  }, [pathname, searchParams]);

  // Don't render if no Pixel ID is configured
  if (!FACEBOOK_PIXEL_ID) {
    return null;
  }

  return (
    <>
      {/* Facebook Pixel Base Code */}
      {/* Loads on all pages. Default consent is 'revoke' until user accepts. */}
      <Script
        id="facebook-pixel"
        strategy="lazyOnload"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Facebook Pixel requires inline script
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            // Meta Consent Mode — default: revoked (GDPR / ePrivacy compliant)
            // fbq('consent', 'grant') will be called by React after user accepts
            fbq('consent', 'revoke');

            fbq('init', '${FACEBOOK_PIXEL_ID}');

            // CCPA Compliance: Limited Data Use (LDU) for California
            fbq('dataProcessingOptions', ['LDU'], 0, 0);

            fbq('track', 'PageView');

            // Core Web Vitals for Facebook ad quality scoring
            function trackWebVitals() {
              try {
                import('web-vitals').then(({ getCLS, getFCP, getLCP, onINP }) => {
                  getLCP((metric) => {
                    fbq('trackCustom', 'WebVital_LCP', {
                      value: Math.round(metric.value),
                      rating: metric.rating
                    });
                  });
                  getFCP((metric) => {
                    fbq('trackCustom', 'WebVital_FCP', {
                      value: Math.round(metric.value),
                      rating: metric.rating
                    });
                  });
                  onINP((metric) => {
                    fbq('trackCustom', 'WebVital_INP', {
                      value: Math.round(metric.value),
                      rating: metric.rating
                    });
                  });
                  getCLS((metric) => {
                    fbq('trackCustom', 'WebVital_CLS', {
                      value: Math.round(metric.value * 1000),
                      rating: metric.rating
                    });
                  });
                }).catch(() => {});
              } catch (_) {}
            }
            trackWebVitals();
          `,
        }}
      />

      {/* Facebook Pixel NoScript Fallback */}
      <noscript>
        {/* biome-ignore lint/performance/noImgElement: Facebook Pixel requires img for noscript */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* Meta Conversions API Parameter Builder (Client JS) removed to prevent fbc suffix corruption */}
    </>
  );
}

/**
 * @deprecated Consent is now managed automatically inside <FacebookPixel /> via useConsent().
 * Kept for backwards compatibility — safe to call but no longer needed.
 */
export function FacebookPixelConsentUpdate(consentGranted: boolean) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (consentGranted) {
    window.fbq("consent", "grant");
  } else {
    window.fbq("consent", "revoke");
  }
}
