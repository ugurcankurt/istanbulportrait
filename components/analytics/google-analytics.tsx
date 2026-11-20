"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
import { useConsent } from "@/contexts/consent-context";

function ensureGtagStub(): boolean {
  if (typeof window === "undefined") return false;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      // biome-ignore lint/complexity/noArguments: Google gtag queue requires arguments object
      window.dataLayer.push(arguments as unknown as Record<string, unknown>);
    };
  }
  return true;
}

export function GoogleAnalytics({
  gaId,
  googleAdsId,
  userId,
}: {
  gaId?: string | null;
  googleAdsId?: string | null;
  userId?: string | null;
}) {
  const { consent, isLoading } = useConsent();
  const lastSetUserId = useRef<string | null>(null);

  const syncUserId = useCallback(async () => {
    if (isLoading || !ensureGtagStub()) return;

    if (consent !== "accepted_all") {
      if (lastSetUserId.current) {
        window.gtag?.("set", { user_id: null } as any);
        lastSetUserId.current = null;
      }
      return;
    }

    let effectiveId = userId || null;

    // Only inspect Supabase session if a Supabase auth cookie exists (zero overhead for anonymous visitors)
    if (!effectiveId && /(?:^|; )sb-[^=]+-auth-token/.test(document.cookie)) {
      try {
        const { createClientSupabaseClient } = await import(
          "@/lib/supabase/client"
        );
        const supabase = createClientSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const email = session?.user?.email?.toLowerCase();
        const isAdmin =
          email === "info@istanbulportrait.com" ||
          email === "ugurcankurt@gmail.com";
        if (session?.user?.id && !isAdmin) {
          effectiveId = session.user.id;
        }
      } catch {
        // Ignore client session lookup errors
      }
    }

    if (typeof window === "undefined" || !window.gtag) return;

    if (effectiveId) {
      if (lastSetUserId.current !== effectiveId) {
        window.gtag("set", { user_id: effectiveId } as any);
        lastSetUserId.current = effectiveId;
      }
    } else if (lastSetUserId.current) {
      window.gtag("set", { user_id: null } as any);
      lastSetUserId.current = null;
    }
  }, [userId, consent, isLoading]);

  // Keep GA4 user_id in sync on the client (login/logout, consent changes)
  // without calling cookies() in the root layout (preserves Vercel Edge ISR caching).
  useEffect(() => {
    syncUserId();
  }, [syncUserId]);

  const primaryTagId = gaId || googleAdsId;
  if (!primaryTagId) {
    return null;
  }

  return (
    <Script
      id="_next-ga"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(primaryTagId)}`}
      strategy="afterInteractive"
      onReady={() => {
        if (!isLoading) {
          GoogleAnalyticsConsentUpdate(consent === "accepted_all");
        }
        syncUserId();
      }}
    />
  );
}

export function GoogleAnalyticsConsentUpdate(granted: boolean) {
  if (typeof window !== "undefined" && window.gtag) {
    if (granted) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
      window.gtag("set", "ads_data_redaction", false as any);
    } else {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      window.gtag("set", "ads_data_redaction", true as any);
    }
  }
}
