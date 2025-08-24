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
              'analytics_storage': 'granted',
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
  const handleAcceptCookies = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    }
    localStorage.setItem("cookie_consent", "accepted");
    // Hide consent banner
    const banner = document.getElementById("cookie-consent-banner");
    if (banner) banner.style.display = "none";
  };

  const handleDeclineCookies = () => {
    localStorage.setItem("cookie_consent", "declined");
    const banner = document.getElementById("cookie-consent-banner");
    if (banner) banner.style.display = "none";
  };

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent) {
      const banner = document.getElementById("cookie-consent-banner");
      if (banner) banner.style.display = "none";
    }
  }, []);

  return (
    <div
      id="cookie-consent-banner"
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50"
    >
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          <p>
            We use cookies to enhance your browsing experience and analyze our
            traffic.
            <a href="/privacy" className="underline hover:text-foreground ml-1">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDeclineCookies}
            className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAcceptCookies}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
