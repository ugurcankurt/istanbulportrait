"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function PackagesHeroSection() {
  const t = useTranslations("packages");

  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 sm:mb-8 lg:mb-10"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            {t("sectionTitle")}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            {t("sectionDescription")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}