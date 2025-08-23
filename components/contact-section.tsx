"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";


export function ContactSection() {
  const t = useTranslations("contact");
  const tui = useTranslations("ui");

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{t("title")}</h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Quick Booking CTA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl">{tui("book_your_session")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
                  {t("cta_description")}
                </p>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">{tui("professional_photographer")}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("experience_description")}
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">{t("premium_locations")}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("locations_description")}
                    </p>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">{t("professional_quality")}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("quality_description")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 sm:pt-4">
                  <Button asChild size="sm" className="w-full sm:size-lg text-xs sm:text-sm">
                    <Link href="/packages">{tui("view_packages")}</Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="w-full sm:size-lg text-xs sm:text-sm">
                    <Link href="/checkout">{tui("book_your_session")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-4 sm:space-y-6"
          >
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">{tui("contact_information")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{tui("location")}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      {t("info.location")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{tui("email")}</h3>
                    <a
                      href={`mailto:${t("info.email")}`}
                      className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm break-all"
                    >
                      {t("info.email")}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{tui("phone")}</h3>
                    <a
                      href={`tel:${t("info.phone")}`}
                      className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm"
                    >
                      {t("info.phone")}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{tui("availability")}</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">{t("info.hours")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">{tui("what_to_expect")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div className="space-y-1 sm:space-y-2">
                  <h4 className="font-medium text-sm sm:text-base">{tui("response_time")}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tui("response_time_desc")}
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h4 className="font-medium text-sm sm:text-base">{tui("booking_process")}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tui("booking_process_desc")}
                  </p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <h4 className="font-medium text-sm sm:text-base">{tui("payment")}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {tui("payment_desc")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
