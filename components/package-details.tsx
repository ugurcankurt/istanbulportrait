"use client";

import { motion } from "framer-motion";
import { Check, Clock, Image as ImageIcon, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trackViewItem } from "@/lib/analytics";
import type { PackageId } from "@/lib/validations";
import { packagePrices } from "@/lib/validations";

interface PackageDetailsProps {
  selectedPackage: PackageId | null;
  onPackageSelect: (packageId: PackageId) => void;
}

export function PackageDetails({
  selectedPackage,
  onPackageSelect,
}: PackageDetailsProps) {
  const t = useTranslations("packages");
  const tui = useTranslations("ui");
  const tpackage = useTranslations("package_selection");

  const packages = [
    {
      id: "essential" as const,
      name: t("essential.title"),
      price: packagePrices.essential,
      duration: t("essential.duration"),
      photos: t("essential.photos"),
      locations: t("essential.locations"),
      features: t.raw("essential.features") as string[],
      popular: false,
    },
    {
      id: "premium" as const,
      name: t("premium.title"),
      price: packagePrices.premium,
      duration: t("premium.duration"),
      photos: t("premium.photos"),
      locations: t("premium.locations"),
      features: t.raw("premium.features") as string[],
      popular: true,
    },
    {
      id: "luxury" as const,
      name: t("luxury.title"),
      price: packagePrices.luxury,
      duration: t("luxury.duration"),
      photos: t("luxury.photos"),
      locations: t("luxury.locations"),
      features: t.raw("luxury.features") as string[],
      popular: false,
    },
    {
      id: "rooftop" as const,
      name: t("rooftop.title"),
      price: packagePrices.rooftop,
      duration: t("rooftop.duration"),
      photos: t("rooftop.photos"),
      locations: t("rooftop.locations"),
      features: t.raw("rooftop.features") as string[],
      popular: false,
    },
  ];

  // Track page view for packages on component mount
  useEffect(() => {
    packages.forEach((pkg) => {
      trackViewItem(pkg.id, pkg.price);
    });
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          {tpackage("choose_package")}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {tpackage("select_description")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {packages.map((pkg, index) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative"
          >
            <Card
              className={`h-full cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col ${
                selectedPackage === pkg.id
                  ? "ring-2 ring-primary shadow-xl bg-gradient-to-b from-background to-primary/5"
                  : pkg.popular
                    ? "ring-2 ring-primary/50 shadow-lg bg-gradient-to-b from-background to-primary/5"
                    : "hover:shadow-md border-2 hover:border-primary/20"
              }`}
              onClick={() => onPackageSelect(pkg.id)}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-2 sm:px-4 py-1 text-xs sm:text-sm">
                    {tui("most_popular")}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2 sm:pb-4 px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">
                  {pkg.name}
                </CardTitle>
                <div className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-4">
                  €{pkg.price}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="font-medium">{pkg.duration}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm">
                    <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="font-medium">{pkg.photos}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    <span className="font-medium">{pkg.locations}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-4 sm:px-6 flex flex-col">
                <ul className="space-y-1.5 sm:space-y-2 flex-1">
                  {pkg.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start space-x-2"
                    >
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 sm:mt-6 pt-2">
                  <Button
                    className="w-full h-12 text-sm sm:text-base font-medium"
                    variant={selectedPackage === pkg.id ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPackageSelect(pkg.id);
                    }}
                  >
                    {selectedPackage === pkg.id
                      ? tui("selected")
                      : tui("select_package")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedPackage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            {tpackage("you_selected")}{" "}
            <span className="font-semibold text-primary">
              {packages.find((p) => p.id === selectedPackage)?.name}
            </span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
