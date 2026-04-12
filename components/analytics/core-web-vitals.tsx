"use client";

import { useEffect } from "react";
import type { Metric } from "web-vitals";

/**
 * Core Web Vitals Tracking Component - 2025 Standards
 * Tracks all Core Web Vitals metrics for comprehensive performance monitoring
 */
export function CoreWebVitals() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track all Core Web Vitals metrics
    const trackCoreWebVitals = () => {
      import("web-vitals")
        .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
          // 1. Largest Contentful Paint (LCP) - Loading performance
          onLCP((metric) => {
            if (window.gtag) {
              window.gtag("event", "web_vital", {
                event_category: "Web Vitals",
                event_label: "LCP",
                value: Math.round(metric.value),
                custom_map: {
                  metric_rating: metric.rating,
                  metric_delta: Math.round(metric.delta),
                },
                non_interaction: true,
              });
            }
          });

          // 2. Interaction to Next Paint (INP) - Interaction responsiveness
          onINP((metric) => {
            if (window.gtag) {
              window.gtag("event", "web_vital", {
                event_category: "Web Vitals",
                event_label: "INP",
                value: Math.round(metric.value),
                custom_map: {
                  metric_rating: metric.rating,
                  metric_delta: Math.round(metric.delta),
                },
                non_interaction: true,
              });
            }
          });

          // 3. Cumulative Layout Shift (CLS) - Visual stability
          onCLS((metric) => {
            if (window.gtag) {
              window.gtag("event", "web_vital", {
                event_category: "Web Vitals",
                event_label: "CLS",
                value: Math.round(metric.value * 1000), // CLS values are very small
                custom_map: {
                  metric_rating: metric.rating,
                  metric_delta: Math.round(metric.delta * 1000),
                },
                non_interaction: true,
              });
            }
          });

          // 4. First Contentful Paint (FCP) - Loading experience
          onFCP((metric: Metric) => {
            if (window.gtag) {
              window.gtag("event", "web_vital", {
                event_category: "Web Vitals",
                event_label: "FCP",
                value: Math.round(metric.value),
                custom_map: {
                  metric_rating: metric.rating,
                  metric_delta: Math.round(metric.delta),
                },
                non_interaction: true,
              });
            }
          });

          // 5. Time to First Byte (TTFB) - Server response time
          onTTFB((metric: Metric) => {
            if (window.gtag) {
              window.gtag("event", "web_vital", {
                event_category: "Web Vitals",
                event_label: "TTFB",
                value: Math.round(metric.value),
                custom_map: {
                  metric_rating: metric.rating,
                  metric_delta: Math.round(metric.delta),
                },
                non_interaction: true,
              });
            }
          });

          // Development logging
          if (process.env.NODE_ENV === "development") {
            // console.log("Core Web Vitals tracking initialized");
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === "development") {
            console.warn("Core Web Vitals tracking failed:", error);
          }
        });
    };

    // Initialize tracking
    trackCoreWebVitals();
  }, []);

  return null;
}
