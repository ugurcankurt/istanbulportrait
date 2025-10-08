"use client";

import { useEffect, useRef } from "react";

interface GetYourGuideWidgetProps {
  tourId: string;
  locale: string;
  variant?: "vertical" | "horizontal" | "compact";
  className?: string;
}

// Locale mapping for GetYourGuide
// Note: Arabic falls back to English as GetYourGuide doesn't support Arabic
const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  ru: "ru-RU",
  ar: "en-US", // Fallback to English - GetYourGuide doesn't support Arabic
  zh: "zh-CN", // Simplified Chinese
};

export function GetYourGuideWidget({
  tourId,
  locale,
  variant = "vertical",
  className = ""
}: GetYourGuideWidgetProps) {
  const widgetRef = useRef<HTMLDivElement>(null);

  const gygLocale = LOCALE_MAP[locale] || "en-US";

  useEffect(() => {
    // Re-initialize GetYourGuide widget when props change
    if (widgetRef.current && typeof window !== "undefined") {
      // Clear existing widget content
      widgetRef.current.innerHTML = `
        <div
          data-gyg-href="https://widget.getyourguide.com/default/availability.frame"
          data-gyg-tour-id="${tourId}"
          data-gyg-locale-code="${gygLocale}"
          data-gyg-currency="EUR"
          data-gyg-widget="availability"
          data-gyg-variant="${variant}"
          data-gyg-partner-id="S6XXHTA"
          data-gyg-cmp="istanbul"
        >
          <span>Powered by <a target="_blank" rel="sponsored" href="https://www.getyourguide.com/">GetYourGuide</a></span>
        </div>
      `;

      // Check if GetYourGuide script is loaded
      if (window.gyg) {
        window.gyg.init();
      } else {
        // Try to wait for script to load
        const checkScript = () => {
          if (window.gyg) {
            window.gyg.init();
          } else {
            setTimeout(checkScript, 500);
          }
        };
        setTimeout(checkScript, 500);
      }
    }
  }, [tourId, gygLocale, variant]);

  return (
    <div
      ref={widgetRef}
      className={`getyourguide-widget ${className}`}
      data-tour-id={tourId}
    >
      {/* Loading placeholder */}
      <div className="flex items-center justify-center min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading tour: {tourId}</p>
        </div>
      </div>
    </div>
  );
}

// Widget with multiple tour options
interface GetYourGuideMultiWidgetProps {
  tourIds: string[];
  locale: string;
  variant?: "vertical" | "horizontal" | "compact";
  className?: string;
}

export function GetYourGuideMultiWidget({
  tourIds,
  locale,
  variant = "vertical",
  className = ""
}: GetYourGuideMultiWidgetProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {tourIds.map((tourId) => (
        <GetYourGuideWidget
          key={tourId}
          tourId={tourId}
          locale={locale}
          variant={variant}
        />
      ))}
    </div>
  );
}

// Declare global GetYourGuide object
declare global {
  interface Window {
    gyg?: {
      init: () => void;
    };
  }
}