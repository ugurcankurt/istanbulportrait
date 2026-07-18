"use client";

import { useEffect, useState } from "react";

/**
 * Modern Interaction Loader for Next.js 16/2026.
 * Delays non-critical scripts until first user interaction (scroll, click, or touch).
 * This optimizes TBT (Total Blocking Time) to near zero on initial load.
 */
export function InteractionLoader({ children }: { children: React.ReactNode }) {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    // If user interacted before hydration, load immediately
    if (load) return;

    const loadScripts = () => {
      setLoad(true);
      removeEventListeners();
    };

    const removeEventListeners = () => {
      window.removeEventListener("scroll", loadScripts);
      window.removeEventListener("mousedown", loadScripts);
      window.removeEventListener("touchstart", loadScripts);
      window.removeEventListener("mousemove", loadScripts);
    };

    // Listen for common engagement signals
    window.addEventListener("scroll", loadScripts, { passive: true });
    window.addEventListener("mousedown", loadScripts, { passive: true });
    window.addEventListener("touchstart", loadScripts, { passive: true });
    // mousemove is a bit aggressive but good for desktop users who move mouse but don't click
    window.addEventListener("mousemove", loadScripts, { passive: true });

    // Fallback: If no interaction within 5 seconds, load anyway
    const fallbackTimeout = setTimeout(loadScripts, 5000);

    return () => {
      removeEventListeners();
      clearTimeout(fallbackTimeout);
    };
  }, [load]);

  if (!load) return null;

  return <>{children}</>;
}
