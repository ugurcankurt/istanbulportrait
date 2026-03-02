"use client";

import { useTranslations } from "next-intl";

export function AboutHeroSection() {
  const t = useTranslations("about");

  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10 animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            {t("sectionTitle")}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            {t("sectionDescription")}
          </p>
        </div>
      </div>
    </section>
  );
}
