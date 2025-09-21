"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { TourCard, TourCardSkeleton } from "@/components/tour-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getPopularIstanbulTours } from "@/lib/viator";
import type { ViatorProduct } from "@/types/viator";

interface ToursSectionProps {
  locale: string;
  className?: string;
}

export function ToursSection({ locale, className = "" }: ToursSectionProps) {
  const t = useTranslations("tours");
  const tui = useTranslations("ui");

  const [tours, setTours] = useState<ViatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTours() {
      try {
        setLoading(true);
        const response = await getPopularIstanbulTours(6, locale);

        if (response.success && response.data) {
          setTours(response.data);
        } else {
          const errorMsg = response.errorMessage || "Failed to load tours";
          setError(errorMsg);
          if (process.env.NODE_ENV === "development") {
            console.error("Viator API Error:", errorMsg);
          }
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load tours";
        setError(errorMsg);
        if (process.env.NODE_ENV === "development") {
          console.error("Tours loading error:", err);
        }

        // Track error for monitoring
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "tours_api_error", {
            error_message: errorMsg,
            locale: locale,
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadTours();
  }, [locale]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section
      className={`py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            {t("sectionTitle")}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            {t("sectionDescription")}
          </p>
        </motion.div>

        {/* Tours Grid */}
        {loading ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div key={index} variants={itemVariants}>
                <TourCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
              <h3 className="text-lg font-medium text-red-900 dark:text-red-100">
                {t("errorTitle")}
              </h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
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
          </motion.div>
        ) : tours.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {tours.map((tour, index) => (
              <motion.div key={tour.productCode} variants={itemVariants}>
                <TourCard tour={tour} locale={locale} showBookButton={true} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {t("noToursTitle")}
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {t("noToursDescription")}
              </p>
            </div>
          </motion.div>
        )}

        {/* View All Tours Button */}
        {tours.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Link href="/tours">
              <Button size="lg" className="group">
                {t("viewAllTours")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Package Cross-sell CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 sm:mt-12 lg:mt-16 text-center"
        >
          <div className="bg-black rounded-lg p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <h2 className="text-lg text-white sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">
              {t("packageDealTitle")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">
              {t("packageDealDescription")}
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="sm:text-base"
            >
              <Link href="/packages">{t("viewPackages")}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Static version for when API is not available
export function StaticToursSection({
  locale,
  className = "",
}: ToursSectionProps) {
  const t = useTranslations("tours");

  const staticTours = [
    {
      title: "Historic Istanbul Walking Tour",
      description: "Explore the ancient wonders of Sultanahmet",
      duration: "4 hours",
      price: "$45",
      rating: 4.8,
      image: "/tours/historic-walking-tour.jpg",
    },
    {
      title: "Bosphorus Sunset Cruise",
      description: "Romantic cruise with dinner and city views",
      duration: "3 hours",
      price: "$65",
      rating: 4.9,
      image: "/tours/bosphorus-cruise.jpg",
    },
    {
      title: "Grand Bazaar & Spice Market Tour",
      description: "Shopping and cultural experience",
      duration: "2.5 hours",
      price: "$35",
      rating: 4.7,
      image: "/tours/bazaar-tour.jpg",
    },
  ];

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
            {t("sectionTitle")}
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 dark:text-gray-300">
            {t("sectionDescription")}
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {staticTours.map((tour, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="rounded-lg border bg-white p-6 shadow-lg dark:bg-gray-900"
            >
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                {tour.title}
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                {tour.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">
                  {tour.price}
                </span>
                <Button size="sm">{t("bookNow")}</Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
