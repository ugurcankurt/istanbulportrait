"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";
import { useConsent } from "@/contexts/consent-context";
import { getUserDataForAdvancedMatching } from "@/lib/analytics";
import { hashCustomerData, hashPhoneNumber } from "@/lib/facebook";

// Extend Window interface locally for global flags
declare global {
  interface Window {
    _fbqInitialized?: boolean;
    _fbqAdvancedMatchingSent?: boolean;
  }
}

export function FacebookPixel({ pixelId }: { pixelId?: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { consent } = useConsent();
  const hasInitialized = useRef(false);
  const advancedMatchingSentRef = useRef(false);

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
    const handlePixel = async () => {
      if (!pixelId || typeof window === "undefined" || !window.fbq) return;

      const userData = getUserDataForAdvancedMatching();
      let hashed: Record<string, string> = {};

      // Check URL for advanced matching parameters passed from email campaigns
      let updatedUserData = { ...userData };
      let hasUrlUserData = false;
      
      const urlEm = searchParams.get("em");
      const urlPh = searchParams.get("ph");
      const urlFn = searchParams.get("fn");
      const urlLn = searchParams.get("ln");
      
      if (urlEm) { updatedUserData.email = urlEm; hasUrlUserData = true; }
      if (urlPh) { updatedUserData.phone = urlPh; hasUrlUserData = true; }
      if (urlFn) { updatedUserData.firstName = urlFn; hasUrlUserData = true; }
      if (urlLn) { updatedUserData.lastName = urlLn; hasUrlUserData = true; }
      
      if (hasUrlUserData) {
        import("@/lib/analytics").then(({ saveUserDataForAdvancedMatching }) => {
          saveUserDataForAdvancedMatching(updatedUserData);
        });
      }

      if (updatedUserData && !advancedMatchingSentRef.current && !window._fbqAdvancedMatchingSent) {
        if (updatedUserData.email) hashed.em = await hashCustomerData(updatedUserData.email);
        if (updatedUserData.phone) hashed.ph = await hashPhoneNumber(updatedUserData.phone);
        if (updatedUserData.firstName) hashed.fn = await hashCustomerData(updatedUserData.firstName);
        if (updatedUserData.lastName) hashed.ln = await hashCustomerData(updatedUserData.lastName);
        if (updatedUserData.country) hashed.country = await hashCustomerData(updatedUserData.country);

        if (Object.keys(hashed).length > 0) {
          window.fbq("init", pixelId, hashed);
          advancedMatchingSentRef.current = true;
          hasInitialized.current = true;
          window._fbqAdvancedMatchingSent = true;
          window._fbqInitialized = true;
        }
      }

      // Initialize normally if advanced matching wasn't applied
      if (!hasInitialized.current && !window._fbqInitialized) {
        window.fbq("init", pixelId);
        hasInitialized.current = true;
        window._fbqInitialized = true;
      }

      window.fbq("track", "PageView");
    };

    // Ensure _fbc and _fbp cookies exist and are valid before firing events
    if (typeof window !== "undefined") {
      let currentFbc: string | null = null;
      let currentFbp: string | null = null;
      const fbcMatch = document.cookie.match(/(^| )_fbc=([^;]+)/);
      if (fbcMatch) currentFbc = fbcMatch[2];
      const fbpMatch = document.cookie.match(/(^| )_fbp=([^;]+)/);
      if (fbpMatch) currentFbp = fbpMatch[2];

      const isValidFbc = currentFbc && /^fb\.[0-9]\.[0-9]{13,}\.[a-zA-Z0-9_=-]+$/.test(currentFbc);
      const isValidFbp = currentFbp && /^fb\.[0-9]\.[0-9]{13,}\.[0-9]+$/.test(currentFbp);

      const fbclid = searchParams.get("fbclid");
      if (fbclid && /^[a-zA-Z0-9_=-]+$/.test(fbclid)) {
        // Always update _fbc if fbclid is in URL to ensure it's fresh and correct
        const fbc = `fb.1.${Date.now()}.${fbclid}`;
        document.cookie = `_fbc=${fbc}; path=/; max-age=7776000; SameSite=Lax`;
      } else if (currentFbc && !isValidFbc) {
        // Clear corrupted fbc cookie
        document.cookie = `_fbc=; path=/; max-age=0; SameSite=Lax`;
      }

      if (!isValidFbp) {
        const fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 10000000000)}`;
        document.cookie = `_fbp=${fbp}; path=/; max-age=7776000; SameSite=Lax`;
      }
    }

    handlePixel();
  }, [pathname, searchParams, pixelId]);

  // Don't render if no Pixel ID is configured
  if (!pixelId) {
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

            // CCPA Compliance: Limited Data Use (LDU) for California
            fbq('dataProcessingOptions', ['LDU'], 0, 0);

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
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
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
