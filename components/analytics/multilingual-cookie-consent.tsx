"use client";

import { useLocale, useTranslations } from "next-intl";
import { FacebookPixelConsentUpdate } from "@/components/analytics/facebook-pixel";
import { GoogleAnalyticsConsentUpdate } from "@/components/analytics/google-analytics";
import { useConsent } from "@/contexts/consent-context";
import { Link } from "@/i18n/routing";

export function MultilingualCookieConsent() {
  const locale = useLocale();
  const t = useTranslations("cookies");
  const tFooter = useTranslations("footer");
  const { consent, setConsent } = useConsent();

  const handleAcceptAll = async () => {
    console.log("Accept All clicked. Starting processes...");

    // Update Facebook Pixel consent
    FacebookPixelConsentUpdate(true);
    GoogleAnalyticsConsentUpdate(true);

    // Finally set consent (which might unmount component)
    await setConsent("accepted_all");
    console.log("Consent set to accepted_all");
  };

  const handleAcceptEssential = async () => {
    await setConsent("essential_only");
    // Facebook Pixel - grant basic analytics but deny ads
    FacebookPixelConsentUpdate(true);
    GoogleAnalyticsConsentUpdate(false);
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
                href={"/privacy" as any}
                className="underline hover:text-foreground ml-1 rtl:mr-1 rtl:ml-0"
                aria-label={`${t("banner.privacy_link")} - ${tFooter("privacy_policy")}`}
              >
                {t("banner.privacy_link")}
                <span className="sr-only"> - {tFooter("privacy_policy")}</span>
              </Link>
            </p>
          </div>

          <div className="flex flex-row gap-2 sm:gap-3 w-full rtl:space-x-reverse">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 px-4 py-2 text-xs sm:text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              {t("buttons.accept_all")}
            </button>
            <button
              type="button"
              onClick={handleAcceptEssential}
              className="flex-1 px-4 py-2 text-xs sm:text-sm border rounded-md hover:bg-muted transition-colors"
            >
              {t("buttons.essential_only")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
