"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { BookingModal } from "@/components/booking-modal";
import { PackageGallery } from "@/components/package-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Image as ImageIcon, MapPin, Star } from "lucide-react";
import { PackageId, packagePrices } from "@/lib/validations";
import { calculateDiscountedPrice } from "@/lib/pricing";
import { PACKAGES_DATA } from "@/lib/packages-data";

interface PackageDetailsProps {
  packageId: PackageId;
}

export function PackageDetails({ packageId }: PackageDetailsProps) {
  const t = useTranslations("packages");
  const tui = useTranslations("ui");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const packageData = PACKAGES_DATA[packageId];
  if (!packageData) return null;

  // Calculate pricing
  const today = new Date();
  const basePrice = packagePrices[packageId];
  const pricing = calculateDiscountedPrice(basePrice, today);

  const features = t.raw(`${packageId}.features`) as string[];
  const packageName = t(`${packageId}.title`);

  return (
    <div className="container mx-auto px-4 py-6 lg:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Gallery */}
        <div className="space-y-6">
          <PackageGallery images={packageData.gallery} alt={packageName} />

        </div>

        {/* Right Column: Details & Booking */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary">
                {t("ui.professional_photographer")}
              </Badge>
              {packageId === "premium" && (
                <Badge className="bg-primary text-primary-foreground">
                  {tui("most_popular")}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{packageName}</h1>

            <div className="flex items-end gap-3 mb-6">
              <div className="text-4xl font-bold text-primary">
                €{pricing.isDiscounted ? pricing.price : basePrice}
              </div>
              {pricing.isDiscounted && (
                <>
                  <div className="text-xl text-muted-foreground line-through mb-1">
                    €{basePrice}
                  </div>
                  <Badge className="bg-destructive text-destructive-foreground mb-2">
                    {t("winter_sale")} -{Math.round(pricing.discountPercentage * 100)}%
                  </Badge>
                </>
              )}
              {packageId === "rooftop" && (
                <span className="text-sm text-muted-foreground mb-2 ml-[-8px]">
                  / {t("per_person")}
                </span>
              )}
            </div>

            {/* Package Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
              <Card className="bg-muted/30 border-none aspect-square flex items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 text-center h-full w-full">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("ui.duration")}</span>
                  <span className="text-sm sm:text-base font-bold">{t(`${packageId}.duration`)}</span>
                </CardContent>
              </Card>
              <Card className="bg-muted/30 border-none aspect-square flex items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 text-center h-full w-full">
                  <ImageIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("ui.photos")}</span>
                  <span className="text-sm sm:text-base font-bold">{t(`${packageId}.photos`)}</span>
                </CardContent>
              </Card>
              <Card className="bg-muted/30 border-none aspect-square flex items-center justify-center">
                <CardContent className="flex flex-col items-center justify-center p-3 sm:p-4 text-center h-full w-full">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary mb-1 sm:mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">{t("ui.locations")}</span>
                  <span className="text-sm sm:text-base font-bold">{t(`${packageId}.locations`)}</span>
                </CardContent>
              </Card>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              {t(`${packageId}.intro`)}
            </p>

            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">{t("ui.what_to_expect")}</h3>
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-base">{feature}</span>
                  </li>
                ))}

              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="w-full sm:w-80 text-lg py-6"
                onClick={() => setIsModalOpen(true)}
              >
                {tui("book_package")}
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
              <Check className="h-3 w-3" />
              {t("ui.payment_desc")}
            </p>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPackage={packageId}
      />
    </div>
  );
}
