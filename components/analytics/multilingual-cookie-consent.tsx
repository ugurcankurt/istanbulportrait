"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { Link } from "@/i18n/routing";

export function MultilingualCookieConsent() {
  const locale = useLocale();
  const t = useTranslations("cookies");

  const handleAcceptAll = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
    }
    localStorage.setItem("cookie_consent", "accepted_all");
    hideBanner();
  };

  const handleAcceptEssential = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
    localStorage.setItem("cookie_consent", "essential_only");
    hideBanner();
  };

  const handleDeclineAll = () => {
    localStorage.setItem("cookie_consent", "declined");
    hideBanner();
  };

  const hideBanner = () => {
    const banner = document.getElementById(
      "multilingual-cookie-consent-banner",
    );
    if (banner) banner.style.display = "none";
  };

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent) {
      hideBanner();
    }
  }, [hideBanner]);

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
            <button
              type="button"
              onClick={handleDeclineAll}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("buttons.decline_all")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
