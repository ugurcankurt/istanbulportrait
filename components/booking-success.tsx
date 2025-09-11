"use client";

import { motion } from "framer-motion";
import { Calendar, CheckCircle, Clock, Mail, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { event } from "@/lib/analytics";
import { formatCurrency, localizeNumerals } from "@/lib/utils";
import type { BookingFormData, PackageId } from "@/lib/validations";
import { packagePrices } from "@/lib/validations";

interface BookingSuccessProps {
  bookingId: string;
  packageId: PackageId;
  customerData?: BookingFormData;
}

export function BookingSuccess({ bookingId, packageId, customerData }: BookingSuccessProps) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tPackages = useTranslations("packages");
  const tsuccess = useTranslations("success");
  const tui = useTranslations("ui");
  const tcontact = useTranslations("contact");

  const packageInfo = {
    name: tPackages(`${packageId}.title`),
    price: packagePrices[packageId],
  };

  // Track successful booking conversion
  useEffect(() => {
    event("conversion", {
      event_category: "ecommerce",
      event_label: `booking_complete_${packageId}`,
      value: packageInfo.price,
    });

    // Track goal completion for GA4
    event("booking_completed", {
      event_category: "conversion",
      event_label: packageId,
      value: packageInfo.price,
    });
  }, [packageId, packageInfo.price]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6 sm:pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="mx-auto mb-4 sm:mb-6"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
            </motion.div>

            <CardTitle className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              {t("success.title")}
            </CardTitle>
            <p className="text-muted-foreground text-base sm:text-lg">
              {t("success.message")}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 sm:space-y-8">
            {/* Booking Details */}
            <div className="bg-muted/30 rounded-lg p-4 sm:p-6 border">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 rtl:space-x-reverse">
                <div className="p-1.5 bg-muted rounded-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {tsuccess("booking_details")}
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm sm:text-base">
                    {tsuccess("booking_id")}:
                  </span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {bookingId.slice(0, 8).toUpperCase()}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm sm:text-base">
                    {tsuccess("package_label")}:
                  </span>
                  <span className="font-semibold text-sm sm:text-base">
                    {packageInfo.name}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm sm:text-base">
                    {tsuccess("amount_paid")}:
                  </span>
                  <span className="font-bold text-sm sm:text-base">
                    {formatCurrency(packageInfo.price, locale)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Details */}
            {customerData && (
              <>
                <div className="bg-muted/30 rounded-lg p-4 sm:p-6 border">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 rtl:space-x-reverse">
                    <div className="p-1.5 bg-muted rounded-lg">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    {tsuccess("customer_details")}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("customer_name")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {customerData.customerName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("customer_email")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {customerData.customerEmail}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("customer_phone")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {customerData.customerPhone}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("booking_date")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {customerData.bookingDate}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("booking_time")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {customerData.bookingTime}
                      </span>
                    </div>

                    {customerData.notes && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground text-sm sm:text-base">
                          {tsuccess("notes")}:
                        </span>
                        <span className="font-semibold text-sm sm:text-base text-right max-w-64 break-words">
                          {customerData.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* What's Next */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 rtl:space-x-reverse">
                <div className="p-1.5 bg-muted rounded-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {tsuccess("whats_next")}
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rtl:gap-reverse p-3 bg-muted/20 rounded-lg border">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {localizeNumerals("1", locale)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {tsuccess("confirmation_email")}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {tsuccess("email_description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rtl:gap-reverse p-3 bg-muted/20 rounded-lg border">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {localizeNumerals("2", locale)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {tsuccess("pre_session_contact")}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {tsuccess("contact_description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rtl:gap-reverse p-3 bg-muted/20 rounded-lg border">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {localizeNumerals("3", locale)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {tsuccess("photo_delivery")}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {tsuccess("delivery_description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 border">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                {tsuccess("have_questions")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rtl:gap-reverse">
                  <div className="p-1.5 bg-muted rounded-lg">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">
                    info@istanbulportrait.com
                  </span>
                </div>
                <div className="flex items-center gap-3 rtl:gap-reverse">
                  <div className="p-1.5 bg-muted rounded-lg">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium phone-number">
                    {tcontact("info.phone")}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 rtl:gap-reverse pt-4">
              <Button asChild className="flex-1 h-11">
                <Link href="/packages">{t("buttons.book_another")}</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 h-11">
                <Link href="/">{tui("back_to_home")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
