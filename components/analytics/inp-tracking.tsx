"use client";

import { useEffect } from "react";

export function INPTracking() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track INP (Interaction to Next Paint)
    const trackINP = () => {
      import("web-vitals").then(({ onINP }) => {
        onINP((metric) => {
          if (window.gtag) {
            window.gtag("event", "web_vital", {
              event_category: "Web Vitals",
              event_label: "INP",
              value: Math.round(metric.value),
              non_interaction: true,
            });
          }
        });
      }).catch((error) => {
        console.log("Web Vitals library failed to load:", error);
      });
    };

    trackINP();
  }, []);

  return null;
}