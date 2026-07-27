"use client";

import { useTranslations, useLocale } from "next-intl";

const localeMap: Record<string, string> = {
  en: "en-US",
  tr: "tr-TR",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  ru: "ru-RU",
  zh: "zh-CN",
  ar: "ar-AE",
  ro: "ro-RO"
};

export function GygActivitiesSection() {
  const t = useTranslations("packages");
  const locale = useLocale();
  const gygLocaleCode = localeMap[locale] || "en-US";

  return (
    <section className="py-12 sm:py-16 bg-background border-t border-border/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif mb-4 font-normal text-foreground leading-tight">
            {t("gyg_title")}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("gyg_subtitle")}
          </p>
        </div>

        <div className="w-full mx-auto overflow-hidden rounded-2xl bg-white shadow-sm border border-border/50">
          <div 
            data-gyg-href="https://widget.getyourguide.com/default/activities.frame" 
            data-gyg-locale-code={gygLocaleCode}
            data-gyg-widget="activities" 
            data-gyg-number-of-items="6" 
            data-gyg-partner-id="S6XXHTA"
            data-gyg-tour-ids="900248,1401375,1086466,447392,1224776,595514"
            className="w-full"
          >
            <span>Powered by <a target="_blank" rel="sponsored" href="https://www.getyourguide.com/istanbul-l56/">GetYourGuide</a></span>
          </div>
        </div>
      </div>
    </section>
  );
}
