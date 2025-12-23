"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { GetYourGuideWidget } from "@/components/getyourguide-widget";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { ISTANBUL_TOURS } from "@/types/getyourguide";

interface ToursSectionProps {
  locale: string;
  className?: string;
}

export function ToursSection({ locale, className = "" }: ToursSectionProps) {
  const t = useTranslations("tours");
  const tui = useTranslations("ui");

  const [showWidgets, setShowWidgets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Popular tours to display
  const popularTours = [
    ISTANBUL_TOURS.MOSAIC_WORKSHOP,
    ISTANBUL_TOURS.BOSPHORUS_DINNER_CRUISE,
    ISTANBUL_TOURS.WHIRLING_DERVISHES,
  ];

  return (
    <section
      className={`py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            {t("sectionTitle")}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            {t("sectionDescription")}
          </p>
        </div>

        {/* Tours Grid */}
        {showWidgets ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mx-auto stagger-children">
            {popularTours.map((tourId) => (
              <div key={tourId}>
                <GetYourGuideWidget
                  tourId={tourId}
                  locale={locale}
                  variant="vertical"
                  className="min-h-[400px]"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
                {t("errorTitle")}
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                GetYourGuide widgets could not be loaded.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                {tui("tryAgain")}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-4 animate-fade-in">
            <div className="mx-auto max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* View All Tours Button */}
        <div className="mt-12 text-center animate-fade-in-up animation-delay-300">
          <Link href="/tours">
            <Button size="lg" className="group">
              {t("viewAllTours")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Package Cross-sell CTA */}
        <div className="mt-8 sm:mt-12 lg:mt-16 text-center animate-fade-in-up animation-delay-400">
          <div className="bg-primary rounded-lg p-4 sm:p-6 lg:p-8 mx-auto">
            <h2 className="text-lg text-primary-foreground sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">
              {t("packageDealTitle")}
            </h2>
            <p className="text-sm sm:text-base text-primary-foreground/80 mb-4 sm:mb-6 px-2">
              {t("packageDealDescription")}
            </p>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="sm:text-base"
            >
              <Link href="/packages">{t("viewPackages")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Note: Static components removed - using GetYourGuide widgets only
