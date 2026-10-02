"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function AdTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const days = 90;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = date.toUTCString();

    const gclid = searchParams.get("gclid");
    if (gclid) {
      document.cookie = `gclid=${gclid};expires=${expires};path=/;SameSite=Lax`;
    }

    const fbclid = searchParams.get("fbclid");
    if (fbclid && /^[a-zA-Z0-9_=-]+$/.test(fbclid)) {
      // Create Meta fbc cookie format: fb.1.timestamp.fbclid
      const fbcValue = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${fbcValue};expires=${expires};path=/;SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}

export function GclidTracker() {
  return (
    <Suspense fallback={null}>
      <AdTrackerInner />
    </Suspense>
  );
}
