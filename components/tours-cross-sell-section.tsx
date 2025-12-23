"use client";

import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export function ToursCrossSellSection() {
  const t = useTranslations("tours");

  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto text-center animate-fade-in-up">
          <div className="bg-primary rounded-lg p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground mr-2 sm:mr-3" />
              <h2 className="text-lg text-primary-foreground sm:text-xl lg:text-2xl font-bold">
                {t("crossSell.title")}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-primary-foreground/80 mb-4 sm:mb-6 px-2">
              {t("crossSell.description")}
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
