"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { GA_TRACKING_ID, pageview } from "@/lib/analytics";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_TRACKING_ID) return;

    const url = pathname + searchParams.toString();
    pageview(url);
  }, [pathname, searchParams]);

  if (!GA_TRACKING_ID) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script
        strategy="afterInteractive"
        id="google-analytics"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'functionality_storage': 'granted',
              'personalization_storage': 'granted',
              'security_storage': 'granted'
            });

            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
              debug_mode: ${process.env.NODE_ENV !== "production"},
              custom_map: {
                'custom_dimension_1': 'package_type',
                'custom_dimension_2': 'user_language'
              }
            });

            // Core Web Vitals tracking for 2025 SEO
            function sendWebVitals() {
              // Import and track Core Web Vitals
              import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB, onINP }) => {
                // Track Largest Contentful Paint (LCP)
                getLCP((metric) => {
                  gtag('event', 'web_vitals', {
                    event_category: 'Web Vitals',
                    event_label: 'LCP',
                    value: Math.round(metric.value),
                    custom_parameter_1: metric.rating,
                    non_interaction: true,
                  });
                });

                // Track First Input Delay (FID) - being replaced by INP in 2025
                getFID((metric) => {
                  gtag('event', 'web_vitals', {
                    event_category: 'Web Vitals',
                    event_label: 'FID',
                    value: Math.round(metric.value),
                    custom_parameter_1: metric.rating,
                    non_interaction: true,
                  });
                });

                // Track Interaction to Next Paint (INP) - new metric for 2025
                onINP((metric) => {
                  gtag('event', 'web_vitals', {
                    event_category: 'Web Vitals',
                    event_label: 'INP',
                    value: Math.round(metric.value),
                    custom_parameter_1: metric.rating,
                    non_interaction: true,
                  });
                });

                // Track Cumulative Layout Shift (CLS)
                getCLS((metric) => {
                  gtag('event', 'web_vitals', {
                    event_category: 'Web Vitals',
                    event_label: 'CLS',
                    value: Math.round(metric.value * 1000),
                    custom_parameter_1: metric.rating,
                    non_interaction: true,
                  });
                });

                // Track First Contentful Paint (FCP)
                getFCP((metric) => {
                  gtag('event', 'web_vitals', {
                    event_category: 'Web Vitals',
                    event_label: 'FCP',
                    value: Math.round(metric.value),
                    custom_parameter_1: metric.rating,
                    non_interaction: true,
                  });
                });

                // Track Time to First Byte (TTFB)
                getTTFB((metric) => {
                  gtag('event', 'web_vitals', {
                    event_category: 'Web Vitals',
                    event_label: 'TTFB',
                    value: Math.round(metric.value),
                    custom_parameter_1: metric.rating,
                    non_interaction: true,
                  });
                });
              }).catch((error) => {
                console.log('Web Vitals library failed to load:', error);
              });
            }

            // Initialize Web Vitals tracking
            sendWebVitals();
          `,
        }}
      />
      {process.env.NODE_ENV !== "production" && (
        <Script
          strategy="afterInteractive"
          id="analytics-test-utilities"
          dangerouslySetInnerHTML={{
            __html: `
              // Analytics Testing Utilities - Development Only
              window.testAnalytics = {
                setup: function() {
                  if (!window.gtag) {
                    console.log('❌ Analytics Test: gtag not loaded');
                    return false;
                  }
                  if (!'${GA_TRACKING_ID}') {
                    console.log('❌ Analytics Test: GA_TRACKING_ID not found');
                    return false;
                  }
                  console.log('✅ Analytics Test: Setup complete');
                  console.log('📊 GA Tracking ID: ${GA_TRACKING_ID}');
                  return true;
                },
                event: function(testName) {
                  if (!window.gtag) {
                    console.log('❌ gtag not available');
                    return;
                  }
                  window.gtag('event', 'test_event', {
                    event_category: 'testing',
                    event_label: testName,
                    value: 1
                  });
                  console.log('🧪 Test Event Fired: ' + testName);
                },
                bookingFlow: function() {
                  console.log('🔍 Testing complete booking flow...');
                  this.event('package_view_test');
                  this.event('add_to_cart_test');
                  this.event('begin_checkout_test');
                  this.event('purchase_test');
                  console.log('✅ Booking flow test completed');
                },
                checkDataLayer: function() {
                  const dataLayer = window.dataLayer || [];
                  console.log('📋 Current dataLayer:', dataLayer);
                  return dataLayer;
                },
                validateGA: function() {
                  const setup = this.setup();
                  if (!setup) return;
                  const dataLayer = this.checkDataLayer();
                  this.event('validation_test');
                  setTimeout(() => {
                    const newDataLayer = this.checkDataLayer();
                    const newEvents = newDataLayer.length - dataLayer.length;
                    console.log('📈 New events added to dataLayer: ' + newEvents);
                  }, 1000);
                }
              };
              
              console.log('🔧 Analytics testing functions available:');
              console.log('   window.testAnalytics.setup()');
              console.log('   window.testAnalytics.event("test_name")');
              console.log('   window.testAnalytics.bookingFlow()');
              console.log('   window.testAnalytics.checkDataLayer()');
              console.log('   window.testAnalytics.validateGA()');
            `,
          }}
        />
      )}
    </>
  );
}

export function CookieConsent() {
  const handleAcceptAll = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    }
    localStorage.setItem("cookie_consent", "accepted_all");
    hideBanner();
  };

  const handleAcceptEssential = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
    localStorage.setItem("cookie_consent", "essential_only");
    hideBanner();
  };

  const handleDeclineAll = () => {
    localStorage.setItem("cookie_consent", "declined");
    hideBanner();
  };

  const hideBanner = () => {
    const banner = document.getElementById("cookie-consent-banner");
    if (banner) banner.style.display = "none";
  };

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent) {
      hideBanner();
    }
  }, []);

  return (
    <div
      id="cookie-consent-banner"
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50 shadow-lg"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">
              We use cookies to enhance your experience and analyze our traffic.
            </p>
            <p className="text-xs">
              Essential cookies are required for basic site functionality.
              Analytics cookies help us improve our services.
              <a
                href="/privacy"
                className="underline hover:text-foreground ml-1"
              >
                Learn more in our Privacy Policy
              </a>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={handleAcceptEssential}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleDeclineAll}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Decline All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
