"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    ym: (id: number, method: string, ...args: unknown[]) => void;
  }
}

interface YandexMetricaProps {
  id?: string;
  enabled?: boolean;
}

export function YandexMetrica({
  id = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID,
  enabled = true,
}: YandexMetricaProps) {
  const pathname = usePathname();

  // Track page views on route changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Track page views on route change
  useEffect(() => {
    if (!id || !enabled || typeof window === "undefined") return;

    // Track page view
    if (window.ym) {
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
        strategy="afterInteractive"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Yandex Metrica requires inline script
        dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],
              k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

            ym(${id}, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true,
              ecommerce:"dataLayer"
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
    const id = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

    if (!id || typeof window === "undefined" || !window.ym) return;

    window.ym(parseInt(id, 10), "reachGoal", eventName, params);
  };

  const trackPurchase = (
    bookingId: string,
    packageId: string,
    amount: number,
    currency: string = "EUR",
  ) => {
    const id = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

    if (!id || typeof window === "undefined" || !window.ym) return;

    // Enhanced E-commerce tracking for Yandex
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
  };

  const trackBookingStart = (packageId: string) => {
    trackEvent("booking_start", { package_id: packageId });
  };

  const trackPackageView = (packageId: string) => {
    trackEvent("package_view", { package_id: packageId });
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
