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

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
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
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-1 sm:px-3 py-0.5 text-[10px] sm:text-xs">
                    {tui("most_popular")}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-1 sm:pb-3 px-2 sm:px-4">
                <CardTitle className="text-sm sm:text-lg font-bold mb-0.5 sm:mb-1">
                  {pkg.name}
                </CardTitle>
                <div className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-3">
                  €{pkg.price}
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <div className="flex items-center justify-center space-x-1 text-[10px] sm:text-xs">
                    <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                    <span className="font-medium">{pkg.duration}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 text-[10px] sm:text-xs">
                    <ImageIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                    <span className="font-medium">{pkg.photos}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1 text-[10px] sm:text-xs">
                    <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                    <span className="font-medium">{pkg.locations}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-2 sm:px-4 flex flex-col">
                <ul className="space-y-1 sm:space-y-1.5 flex-1">
                  {pkg.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start space-x-1.5"
                    >
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs leading-tight sm:leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 sm:mt-4 pt-1 sm:pt-2">
                  <Button
                    className="w-full h-8 sm:h-10 text-xs sm:text-sm font-medium"
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
