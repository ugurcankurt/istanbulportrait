"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

export function ContactSection() {
  const t = useTranslations("contact");
  const tui = useTranslations("ui");

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mx-auto stagger-children">
          {/* Quick Booking CTA */}
          <div className="hover-scale">
            <Card className="h-full flex flex-col">
              <CardHeader className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-2">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl text-center lg:text-left">
                  {tui("book_your_session")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between p-4 sm:p-5 lg:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {t("cta_description")}
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-1 text-sm sm:text-base">
                        {tui("professional_photographer")}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("experience_description")}
                      </p>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-1 text-sm sm:text-base">
                        {t("premium_locations")}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {t("locations_description")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
                  <Button
                    asChild
                    size="sm"
                    className="w-full sm:text-sm lg:text-base"
                  >
                    <Link href="/packages">{tui("view_packages")}</Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full sm:text-sm lg:text-base"
                  >
                    <Link href="/checkout">{tui("book_your_session")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* What to Expect & Additional Info */}
          <div className="hover-scale">
            <Card className="h-full flex flex-col">
              <CardHeader className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-2">
                <CardTitle className="text-lg sm:text-xl text-center lg:text-left">
                  {tui("what_to_expect")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 sm:p-5 lg:p-6 pt-0">
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="font-medium text-sm sm:text-base">
                      {tui("response_time")}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {tui("response_time_desc")}
                    </p>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="font-medium text-sm sm:text-base">
                      {tui("booking_process")}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {tui("booking_process_desc")}
                    </p>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <h4 className="font-medium text-sm sm:text-base">
                      {tui("payment")}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {tui("payment_desc")}
                    </p>
                  </div>

                  {/* Additional Professional Quality Info */}
                  <div className="border-t pt-3 sm:pt-4 mt-4 sm:mt-5">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold mb-1 text-sm sm:text-base">
                        {t("professional_quality")}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {t("quality_description")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="hover-scale">
            <Card className="h-full flex flex-col">
              <CardHeader className="px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-2">
                <CardTitle className="text-lg sm:text-xl text-center lg:text-left">
                  {tui("contact_information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 sm:p-5 lg:p-6 pt-0">
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-start space-x-3 sm:space-x-4 rtl:space-x-reverse">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">
                        {tui("location")}
                      </h3>
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                        {t("info.location")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4 rtl:space-x-reverse">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">
                        {tui("email")}
                      </h3>
                      <a
                        href={`mailto:${t("info.email")}`}
                        className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm break-all"
                      >
                        {t("info.email")}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4 rtl:space-x-reverse">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">
                        {tui("phone")}
                      </h3>
                      <a
                        href={`tel:${t("info.phone")}`}
                        className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm phone-number"
                      >
                        {t("info.phone")}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4 rtl:space-x-reverse">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base">
                        {tui("availability")}
                      </h3>
                      <p className="text-muted-foreground text-xs sm:text-sm">
                        {t("info.hours")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
