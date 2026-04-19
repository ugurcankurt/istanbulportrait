"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
// Dynamic pricing replaces static packagePrices

declare global {
  interface Window {
    ym: (id: number, method: string, ...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
    __YANDEX_ID?: string;
  }
}

interface YandexMetricaProps {
  id?: string;
  enabled?: boolean;
}

export function YandexMetrica({
  id,
  enabled = true,
}: YandexMetricaProps) {
  const pathname = usePathname();

  // Track page views on route changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Track page views on route change
  useEffect(() => {
    if (!id || !enabled || typeof window === "undefined") return;

    // Track page view
    if (window.ym) {
      window.__YANDEX_ID = id; // Store ID for client-side hooks dynamically
      window.ym(parseInt(id, 10), "hit", window.location.href);
    }
  }, [pathname, id, enabled]);

  // Don't render if no ID or disabled
  if (!id || !enabled) {
    return null;
  }

  return (
    <>
      <Script
        id="yandex-metrica"
        strategy="lazyOnload"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Yandex Metrica requires inline script
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=" + ${id}, "ym");

            ym(${id}, "init", {
                ssr: true,
                webvisor: true,
                clickmap: true,
                ecommerce: "dataLayer",
                referrer: document.referrer,
                url: location.href,
                accurateTrackBounce: true,
                trackLinks: true
            });
          `,
        }}
      />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}

// Hook for tracking custom events
export function useYandexMetrica() {
  const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
    const id = typeof window !== "undefined" ? window.__YANDEX_ID : undefined;

    if (!id || typeof window === "undefined" || !window.ym) return;

    window.ym(parseInt(id, 10), "reachGoal", eventName, params);
  };

  const trackPurchase = (
    bookingId: string,
    packageId: string,
    amount: number,
    currency: string = "EUR",
  ) => {
    const id = typeof window !== "undefined" ? window.__YANDEX_ID : undefined;

    if (!id || typeof window === "undefined" || !window.ym) return;

    // 1. Legacy reachGoal tracking (keeping for continuity)
    window.ym(parseInt(id, 10), "reachGoal", "purchase", {
      order_id: bookingId,
      order_price: amount,
      currency: currency,
      items: [
        {
          id: packageId,
          name: `Photography Package - ${packageId}`,
          category: "Photography Services",
          price: amount,
          quantity: 1,
        },
      ],
    });

    // 2. Standard E-commerce dataLayer tracking
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      ecommerce: {
        purchase: {
          actionField: {
            id: bookingId,
            revenue: amount,
            currency: currency,
          },
          products: [
            {
              id: packageId,
              name: `Photography Package - ${packageId}`,
              price: amount,
              category: "Photography Services",
              quantity: 1,
            },
          ],
        },
      },
    });
  };

  const trackBookingStart = (packageId: string, price: number = 0) => {
    trackEvent("booking_start", { package_id: packageId });

    // Track as "Add to Cart" for E-commerce funnel
    if (typeof window !== "undefined") {


      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        ecommerce: {
          add: {
            products: [
              {
                id: packageId,
                name: `Photography Package - ${packageId}`,
                price: price,
                category: "Photography Services",
                quantity: 1,
              },
            ],
          },
        },
      });
    }
  };

  const trackPackageView = (packageId: string, price: number = 0) => {
    trackEvent("package_view", { package_id: packageId });

    // Track as "Detail" view for E-commerce
    if (typeof window !== "undefined") {


      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        ecommerce: {
          detail: {
            products: [
              {
                id: packageId,
                name: `Photography Package - ${packageId}`,
                price: price,
                category: "Photography Services",
              },
            ],
          },
        },
      });
    }
  };

  const trackContactForm = (source: string) => {
    trackEvent("contact_form", { source });
  };

  return {
    trackEvent,
    trackPurchase,
    trackBookingStart,
    trackPackageView,
    trackContactForm,
  };
}
