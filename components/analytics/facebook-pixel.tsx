"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { FACEBOOK_PIXEL_ID } from "@/lib/facebook";

declare global {
  interface Window {
    fbq: (
      command: "track" | "trackCustom" | "init" | "consent",
      eventName: string,
      parameters?: Record<string, unknown>,
    ) => void;
    _fbq: typeof window.fbq;
  }
}

export function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!FACEBOOK_PIXEL_ID) return;

    // Track page views on route changes
    const url = pathname + searchParams.toString();

    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView");

      // Debug logging in development
      if (process.env.NODE_ENV === "development") {
        console.log("Facebook Pixel - PageView:", url);
      }
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
            fbq('track', 'PageView');
            
            // Track Core Web Vitals for Facebook
            function trackWebVitals() {
              try {
                // Import and track Core Web Vitals
                import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB, onINP }) => {
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
                }).catch((error) => {
                  console.log('Web Vitals library failed to load for Facebook:', error);
                });
              } catch (error) {
                console.log('Web Vitals tracking failed for Facebook:', error);
              }
            }
            
            // Initialize Web Vitals tracking
            trackWebVitals();
          `,
        }}
      />

      {/* Facebook Pixel NoScript Fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* Development Testing Utilities */}
      {process.env.NODE_ENV === "development" && (
        <Script
          id="facebook-pixel-test-utilities"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Facebook Pixel Testing Utilities - Development Only
              window.testFacebookPixel = {
                setup: function() {
                  if (!window.fbq) {
                    console.log('❌ Facebook Pixel Test: fbq not loaded');
                    return false;
                  }
                  if (!'${FACEBOOK_PIXEL_ID}') {
                    console.log('❌ Facebook Pixel Test: PIXEL_ID not found');
                    return false;
                  }
                  console.log('✅ Facebook Pixel Test: Setup complete');
                  console.log('📊 Facebook Pixel ID: ${FACEBOOK_PIXEL_ID}');
                  return true;
                },
                
                trackTest: function(eventName) {
                  if (!window.fbq) {
                    console.log('❌ fbq not available');
                    return;
                  }
                  window.fbq('trackCustom', 'Test_' + eventName, {
                    test: true,
                    timestamp: Date.now()
                  });
                  console.log('🧪 Facebook Test Event Fired: Test_' + eventName);
                },
                
                trackBookingFlow: function() {
                  console.log('🔍 Testing Facebook booking flow...');
                  this.trackTest('ViewContent_Package');
                  setTimeout(() => this.trackTest('Lead_Booking'), 1000);
                  setTimeout(() => this.trackTest('InitiateCheckout'), 2000);
                  setTimeout(() => this.trackTest('Purchase'), 3000);
                  console.log('✅ Facebook booking flow test completed');
                },
                
                trackStandardEvents: function() {
                  const events = ['ViewContent', 'Lead', 'InitiateCheckout', 'Purchase'];
                  events.forEach((event, index) => {
                    setTimeout(() => {
                      window.fbq('track', event, {
                        content_ids: ['test_package'],
                        content_type: 'product',
                        value: 100 + (index * 50),
                        currency: 'EUR'
                      });
                      console.log('📊 Facebook Standard Event: ' + event);
                    }, index * 500);
                  });
                },
                
                checkPixelStatus: function() {
                  const setup = this.setup();
                  if (!setup) return;
                  
                  // Test basic tracking
                  this.trackTest('PixelStatusCheck');
                  
                  // Check if events are being queued
                  if (window.fbq.queue) {
                    console.log('📋 Facebook Pixel Queue Length:', window.fbq.queue.length);
                  }
                  
                  console.log('🔍 Facebook Pixel Status Check Complete');
                }
              };
              
              console.log('🔧 Facebook Pixel testing functions available:');
              console.log('   window.testFacebookPixel.setup()');
              console.log('   window.testFacebookPixel.trackTest("event_name")');
              console.log('   window.testFacebookPixel.trackBookingFlow()');
              console.log('   window.testFacebookPixel.trackStandardEvents()');
              console.log('   window.testFacebookPixel.checkPixelStatus()');
            `,
          }}
        />
      )}
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

  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log(
      "Facebook Pixel Consent Updated:",
      consentGranted ? "granted" : "revoked",
    );
  }
}
