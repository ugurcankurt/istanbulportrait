"use client";

import dynamic from "next/dynamic";

/**
 * Client Component and Deferred Loader for Non-SSR components.
 * This is used to bypass Next.js 16/Turbopack's restriction of using 'ssr: false'
 * inside Server Components (like layout.tsx).
 */

const MicrosoftClarity = dynamic(
  () =>
    import("@/components/analytics/microsoft-clarity").then(
      (mod) => mod.MicrosoftClarity,
    ),
  { ssr: false },
);

const MultilingualCookieConsent = dynamic(
  () =>
    import("@/components/analytics/multilingual-cookie-consent").then(
      (mod) => mod.MultilingualCookieConsent,
    ),
  { ssr: false },
);

export function DeferredAnalytics({
  clarityId,
}: {
  clarityId?: string | null;
}) {
  return <>{clarityId && <MicrosoftClarity clarityId={clarityId} />}</>;
}

export function DeferredCookieConsent() {
  return <MultilingualCookieConsent />;
}
