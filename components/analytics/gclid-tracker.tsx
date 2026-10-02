"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function GclidTrackerInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const gclid = searchParams.get("gclid");
    if (gclid) {
      // Save gclid to a cookie that expires in 90 days
      const days = 90;
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `gclid=${gclid};expires=${date.toUTCString()};path=/;SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}

export function GclidTracker() {
  return (
    <Suspense fallback={null}>
      <GclidTrackerInner />
    </Suspense>
  );
}
