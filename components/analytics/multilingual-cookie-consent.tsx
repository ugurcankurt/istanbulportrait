"use client";

import { useLocale, useTranslations } from "next-intl";
import { FacebookPixelConsentUpdate } from "@/components/analytics/facebook-pixel";
import { useConsent } from "@/contexts/consent-context";
import { Link } from "@/i18n/routing";

export function MultilingualCookieConsent() {
  const locale = useLocale();
  const t = useTranslations("cookies");
  const { consent, setConsent } = useConsent();

  const handleAcceptAll = async () => {
    console.log("Accept All clicked. Starting processes...");

    // Register for Push Notifications first to ensure it runs
    if (typeof window !== "undefined") {
      try {
        console.log("Initializing push notifications...");
        const { registerServiceWorkerAndSubscribe } = await import("@/lib/push-notifications");
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

        if (vapidKey) {
          await registerServiceWorkerAndSubscribe(vapidKey);
          console.log("Push notification registration attempted.");
        } else {
          console.error("VAPID Key is missing!");
        }
      } catch (err) {
        console.error("Error during push registration:", err);
      }
    }

    // Update Facebook Pixel consent
    FacebookPixelConsentUpdate(true);

    // Finally set consent (which might unmount component)
    await setConsent("accepted_all");
    console.log("Consent set to accepted_all");
  };

  const handleAcceptEssential = async () => {
    await setConsent("essential_only");
    // Facebook Pixel - grant basic analytics but deny ads
    FacebookPixelConsentUpdate(true);
  };

  // Don't show banner if user has already made a choice
  if (consent !== null) {
    return null;
  }

  return (
    <div
      id="multilingual-cookie-consent-banner"
      className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50 shadow-lg"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">{t("banner.title")}</p>
            <p className="text-xs">
              {t("banner.description")}
              <Link
                href="/privacy"
                className="underline hover:text-foreground ml-1 rtl:mr-1 rtl:ml-0"
              >
                {t("banner.privacy_link")}
              </Link>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 rtl:space-x-reverse">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              {t("buttons.accept_all")}
            </button>
            <button
              type="button"
              onClick={handleAcceptEssential}
              className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              {t("buttons.essential_only")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
