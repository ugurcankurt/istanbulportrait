"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Clock, Image as ImageIcon, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BookingModal } from "@/components/booking-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { fbPixel } from "@/lib/facebook";
import type { PackageId } from "@/lib/validations";

export function PackagesSection() {
  const t = useTranslations("packages");
  const tui = useTranslations("ui");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackageForModal, setSelectedPackageForModal] =
    useState<PackageId | null>(null);

  const packages = [
    {
      id: "essential",
      name: t("essential.title"),
      price: t("essential.price"),
      duration: t("essential.duration"),
      photos: t("essential.photos"),
      locations: t("essential.locations"),
      features: t.raw("essential.features") as string[],
      popular: false,
      image: "/images/locations/galata-bridge-2.webp",
    },
    {
      id: "premium",
      name: t("premium.title"),
      price: t("premium.price"),
      duration: t("premium.duration"),
      photos: t("premium.photos"),
      locations: t("premium.locations"),
      features: t.raw("premium.features") as string[],
      popular: true,
      image: "/gallery/istanbul_couple_photoshoot_1.webp",
    },
    {
      id: "luxury",
      name: t("luxury.title"),
      price: t("luxury.price"),
      duration: t("luxury.duration"),
      photos: t("luxury.photos"),
      locations: t("luxury.locations"),
      features: t.raw("luxury.features") as string[],
      popular: false,
      image: "/gallery/istanbul_wedding_photographer_1.webp",
    },
    {
      id: "rooftop",
      name: t("rooftop.title"),
      price: t("rooftop.price"),
      duration: t("rooftop.duration"),
      photos: t("rooftop.photos"),
      locations: t("rooftop.locations"),
      features: t.raw("rooftop.features") as string[],
      popular: false,
      image: "/images/locations/bosphorus-rooftop-hero.webp",
    },
  ];

  // Track ViewContent events for Facebook Commerce Manager
  useEffect(() => {
    // Track each package as a service for Facebook Commerce
    packages.forEach((pkg) => {
      fbPixel.track("ViewContent", {
        content_type: "service",
        content_ids: [pkg.id],
        content_name: pkg.name,
        content_category: "Photography Services",
        value: parseFloat(pkg.price.replace(/[€$]/g, "")),
        currency: "EUR",
        num_items: 1,
      });
    });
  }, [packages]);

  const handlePackageSelect = (packageId: PackageId) => {
    setSelectedPackageForModal(packageId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPackageForModal(null);
  };

  return (
    <>
      <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Package Options Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 sm:mb-12"
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6">
              {t("sections.available_packages")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center max-w-4xl mx-auto px-4">
              {t("sections.intro")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="relative"
              >
                <Card
                  className={`h-full transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden p-0 gap-0 pt-0 ${pkg.popular ? "ring-2 ring-primary shadow-xl sm:scale-105 bg-gradient-to-b from-background to-primary/5" : "hover:shadow-md border-2 hover:border-primary/20"}`}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={pkg.image}
                      alt={pkg.name}
                      fill
                      className="object-cover transition-transform duration-500 hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-md font-bold text-lg sm:text-xl shadow-lg border border-white/20">
                      {pkg.price}
                    </div>
                  </div>

                  {pkg.popular && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-2 sm:px-4 py-1 text-xs sm:text-sm shadow-md">
                        {tui("most_popular")}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2 sm:pb-2 px-3 sm:px-4 pt-4">
                    <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                      {pkg.name}
                    </h3>


                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span className="font-medium">{pkg.duration}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm">
                        <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span className="font-medium">{pkg.photos}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-xs sm:text-sm">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                        <span className="font-medium">{pkg.locations}</span>
                      </div>
                    </div>
                    <div className="my-2 border-t border-border" />
                  </CardHeader>

                  <CardContent className="flex-1 px-3 sm:px-4">
                    <ul className="space-y-1 sm:space-y-1.5">
                      {pkg.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start space-x-2 sm:space-x-2.5 rtl:space-x-reverse"
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs sm:text-sm leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-2 sm:pt-2 px-3 sm:px-4 pb-4">
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => handlePackageSelect(pkg.id as PackageId)}
                    >
                      <span className="text-base sm:text-lg font-bold">
                        {tui("book_package")}
                      </span>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 sm:mt-12 lg:mt-16 text-center"
          >
            <div className="bg-primary rounded-lg p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
              <h2 className="text-lg text-primary-foreground sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4">
                {t("custom.title")}
              </h2>
              <p className="text-sm sm:text-base text-primary-foreground/80 mb-4 sm:mb-6 px-2">
                {t("custom.description")}
              </p>
              <Button
                asChild
                variant="secondary"
                size="sm"
                className="sm:text-base"
              >
                <Link href="/contact">{t("custom.button")}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        selectedPackage={selectedPackageForModal}
      />
    </>
  );
}
