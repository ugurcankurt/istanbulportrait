"use client";

import { useEffect } from "react";

interface ExtendedPerformanceEventTiming {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  interactionId?: number;
  processingStart?: number;
  processingEnd?: number;
}

interface INPMetric {
  name: "INP";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  entries: ExtendedPerformanceEventTiming[];
  navigationType: string;
}

export function INPTracking() {
  useEffect(() => {
    // Only track in production
    if (process.env.NODE_ENV !== "production") return;

    // Check if browser supports INP measurement
    if (!("PerformanceObserver" in window)) return;

    let inpValue = 0;
    let inpEntries: ExtendedPerformanceEventTiming[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as ExtendedPerformanceEventTiming[];

      entries.forEach((entry) => {
        // Track interaction events (click, keydown, keypress, etc.)
        if (
          entry.interactionId &&
          entry.processingStart &&
          entry.processingEnd
        ) {
          const interactionTime = entry.processingEnd - entry.processingStart;

          // Keep track of the worst (longest) interaction
          if (interactionTime > inpValue) {
            inpValue = interactionTime;
            inpEntries = [entry];
          }
        }
      });
    });

    // Observe all interaction events
    try {
      observer.observe({
        type: "event",
        buffered: true,
      });
    } catch (error) {
      // Fallback for browsers that don't support the latest API
      try {
        observer.observe({ entryTypes: ["event"] });
      } catch (fallbackError) {
        console.warn("INP tracking not supported in this browser");
      }
    }

    // Report INP on page visibility change or unload
    const reportINP = () => {
      if (inpValue > 0) {
        const rating =
          inpValue <= 200
            ? "good"
            : inpValue <= 500
              ? "needs-improvement"
              : "poor";

        const inpMetric: INPMetric = {
          name: "INP",
          value: Math.round(inpValue),
          rating,
          entries: inpEntries,
          navigationType: "navigate",
        };

        // Send to Google Analytics 4
        if (window.gtag) {
          window.gtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_label: "INP",
            value: Math.round(inpValue),
            custom_parameter_1: rating,
            non_interaction: true,
          });
        }

        // Send to Yandex Metrica
        if (window.ym && process.env.NEXT_PUBLIC_YANDEX_METRICA_ID) {
          window.ym(
            parseInt(process.env.NEXT_PUBLIC_YANDEX_METRICA_ID),
            "reachGoal",
            "web_vitals_inp",
            {
              value: Math.round(inpValue),
              rating: rating,
              interaction_count: inpEntries.length,
            },
          );
        }

        // Send to Facebook Pixel for conversion optimization
        if (window.fbq) {
          window.fbq("trackCustom", "WebVitalsINP", {
            value: Math.round(inpValue),
            rating: rating,
            content_category: "performance",
          });
        }

        // Log in development
        if (process.env.NODE_ENV === "development") {
          console.log("🎯 INP Metric:", inpMetric);
        }
      }
    };

    // Report on visibility change (tab switch, minimize)
    document.addEventListener("visibilitychange", reportINP, { once: true });

    // Report on page unload
    window.addEventListener("beforeunload", reportINP, { once: true });

    // Cleanup
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", reportINP);
      window.removeEventListener("beforeunload", reportINP);
    };
  }, []);

  // Component doesn't render anything
  return null;
}

// Hook for manual INP tracking in specific components
export function useINPTracking() {
  const trackInteraction = (interactionName: string, startTime?: number) => {
    if (!startTime) startTime = performance.now();

    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime!;

        // Send interaction-specific metrics
        if (window.gtag) {
          window.gtag("event", "custom_interaction", {
            event_category: "User Interactions",
            event_label: interactionName,
            value: Math.round(duration),
            non_interaction: true,
          });
        }

        if (process.env.NODE_ENV === "development") {
          console.log(
            `⚡ Interaction "${interactionName}": ${Math.round(duration)}ms`,
          );
        }
      },
    };
  };

  return { trackInteraction };
}
