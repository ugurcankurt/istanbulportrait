"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { FACEBOOK_PIXEL_ID } from "@/lib/facebook";



export function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Track page views on route change
  useEffect(() => {
    if (!FACEBOOK_PIXEL_ID) return;

    // Track page views on route changes
    // const url = pathname + searchParams.toString();

    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  // Don't render if no Pixel ID is configured
  if (!FACEBOOK_PIXEL_ID) {
    return null;
  }

  return (
    <>
      {/* Facebook Pixel Base Code */}
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
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
            
            fbq('init', '${FACEBOOK_PIXEL_ID}');
            
            // CCPA Compliance: Limited Data Use (LDU) for California
            // 0, 0 means no geographic restriction - applies to all users
            // For California-only: use 1, 1000
            fbq('dataProcessingOptions', ['LDU'], 0, 0);
            
            fbq('track', 'PageView');
            
            // Track Core Web Vitals for Facebook
            function trackWebVitals() {
              try {
                // Import and track Core Web Vitals
                import('web-vitals').then(({ getCLS, getFCP, getLCP, getTTFB, onINP }) => {
                  // Track key metrics that affect Facebook ad performance
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

                  // Track INP (replaced FID in 2024 Core Web Vitals)
                  onINP((metric) => {
                    fbq('trackCustom', 'WebVital_INP', {
                      value: Math.round(metric.value),
                      rating: metric.rating
                    });
                  });

                  getCLS((metric) => {
                    fbq('trackCustom', 'WebVital_CLS', {
                      value: Math.round(metric.value * 1000), // CLS is very small, multiply for better reporting
                      rating: metric.rating
                    });
                  });
                }).catch(() => {
                  // Web Vitals library failed to load
                });
              } catch (error) {
                // Web Vitals tracking failed
              }
            }
            
            // Initialize Web Vitals tracking
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
    </>
  );
}

// Cookie Consent Integration
export function FacebookPixelConsentUpdate(consentGranted: boolean) {
  if (typeof window === "undefined" || !window.fbq) return;

  // Update Facebook Pixel consent
  if (consentGranted) {
    window.fbq("consent", "grant");
  } else {
    window.fbq("consent", "revoke");
  }
}
