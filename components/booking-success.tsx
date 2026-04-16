"use client";

import {
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Phone,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { formatCurrency, localizeNumerals } from "@/lib/utils";
import type { BookingFormData, PackageId } from "@/lib/validations";
import { usePackagesStore } from "@/stores/packages-store";
import { settingsService, type SiteSettings } from "@/lib/settings-service";
import { useEffect, useState } from "react";

interface BookingSuccessProps {
  bookingId: string;
  packageId: PackageId;
  customerData?: BookingFormData;
  confirmedBooking?: any;
  promoCode?: string;
}

export function BookingSuccess({
  bookingId,
  packageId,
  customerData,
  confirmedBooking,
  promoCode,
}: BookingSuccessProps) {
  const locale = useLocale();
  const t = useTranslations("checkout");
  const tPackages = useTranslations("packages");
  const tsuccess = useTranslations("success");
  const tui = useTranslations("ui");
  const tcontact = useTranslations("contact");

  const { packages, fetchPackages } = usePackagesStore();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchPackages();
    settingsService.getSettings().then(setSettings);
  }, [fetchPackages]);

  const packageDBInfo = packages.find((p) => p.slug === packageId);
  const basePrice = packageDBInfo ? Number(packageDBInfo.price) : 150;

  const packageInfo = {
    name: packageDBInfo?.title?.[locale] || packageDBInfo?.title?.["en"] || packageDBInfo?.slug || packageId,
    price: basePrice,
  };

  // Determine the effective data (prefer confirmedBooking from API)
  const peopleCount =
    confirmedBooking?.peopleCount || customerData?.peopleCount || 1;

  // Use the confirmed booking ID from API if available
  const displayBookingId = confirmedBooking?.id || bookingId;

  // Check for dynamic differences to reveal applied discounts
  const isPerPerson = packageDBInfo?.is_per_person || false;
  const baseTotal = isPerPerson ? basePrice * peopleCount : basePrice;
  const paidTotal = confirmedBooking?.totalAmount || 0;

  const discountAmount = baseTotal > 0 ? Math.max(0, baseTotal - paidTotal) : 0;
  const isDiscounted = discountAmount > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 max-w-6xl">
      <div>
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6 sm:pb-8">
            <div className="mx-auto mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
            </div>

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
                    {displayBookingId.slice(0, 8).toUpperCase()}
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

                <div className="flex flex-col gap-2 w-full pt-2">
                  <div className="space-y-2 w-full mt-2">
                    {/* Conditional Discount Details */}
                    {isDiscounted && (
                      <div className="bg-sale/10 rounded-md p-3 mb-2 border border-sale/20 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Original Price:</span>
                          <span className="line-through text-muted-foreground">{formatCurrency(baseTotal, locale)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-sale font-bold">
                          <span>Discount Applied:</span>
                          <span>-{formatCurrency(discountAmount, locale)}</span>
                        </div>
                      </div>
                    )}

                    {/* Total Amount */}
                    <div className="flex justify-between items-center py-2">
                      <span className="font-bold text-foreground text-base sm:text-lg">
                        {t("labels.total_amount")}:
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-xl sm:text-2xl text-primary">
                          {formatCurrency(paidTotal, locale)}
                        </span>
                      </div>
                    </div>

                    {/* Payment on Date (Cash) */}
                    <div className="flex justify-between items-center p-3 bg-success/10 rounded border border-success/20 mt-2">
                      <span className="font-bold text-success text-sm sm:text-base">
                        To pay exactly on event day:
                      </span>
                      <span className="font-black text-success text-base sm:text-lg">
                        {formatCurrency(paidTotal, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Details */}
            {(customerData || confirmedBooking) && (
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
                        {confirmedBooking?.customerName ||
                          customerData?.customerName}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("customer_email")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {confirmedBooking?.customerEmail ||
                          customerData?.customerEmail}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("customer_phone")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {confirmedBooking?.customerPhone ||
                          customerData?.customerPhone}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("booking_date")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {confirmedBooking?.bookingDate ||
                          customerData?.bookingDate}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm sm:text-base">
                        {tsuccess("booking_time")}:
                      </span>
                      <span className="font-semibold text-sm sm:text-base">
                        {confirmedBooking?.bookingTime ||
                          customerData?.bookingTime}
                      </span>
                    </div>

                    {peopleCount && peopleCount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm sm:text-base">
                          {tsuccess("people_count")}:
                        </span>
                        <span className="font-semibold text-sm sm:text-base">
                          {peopleCount}{" "}
                          {peopleCount === 1 ? t("person") : t("people")}
                        </span>
                      </div>
                    )}

                    {(customerData?.notes || confirmedBooking?.notes) && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground text-sm sm:text-base mr-4 whitespace-nowrap">
                          {tsuccess("notes")}:
                        </span>
                        <span className="font-semibold text-sm sm:text-base text-right max-w-[60%]">
                          {confirmedBooking?.notes || customerData?.notes}
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
                    {settings?.contact_email || "info@360istanbul.com.tr"}
                  </span>
                </div>
                <div className="flex items-center gap-3 rtl:gap-reverse">
                  <div className="p-1.5 bg-muted rounded-lg">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium phone-number">
                    {settings?.contact_phone || tcontact("info.phone")}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 rtl:gap-reverse pt-4">
              <Button nativeButton={false} render={<Link href={"/packages" as any} />} className="flex-1 h-11">
                {t("buttons.book_another")}
              </Button>
              <Button nativeButton={false} render={<Link href="/" />} variant="outline" className="flex-1 h-11">
                {tui("back_to_home")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
