"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function trackContactEvent(method: string) {
  if (typeof window !== "undefined") {
    // Generate unique event_id for Pixel/CAPI deduplication
    const eventId =
      typeof crypto !== "undefined" ? crypto.randomUUID() : undefined;

    // Facebook Contact event — AEM Priority 7
    if (window.fbq) {
      window.fbq(
        "track",
        "Contact",
        {
          content_name: method,
          content_category: "Photography Inquiry",
        },
        eventId ? { eventID: eventId } : undefined,
      );
    }
    // GA4
    if (window.gtag) {
      window.gtag("event", "contact", {
        event_category: "Engagement",
        event_label: method,
      });
    }
    // CAPI — Contact server-side
    fetch("/api/facebook/conversions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "Contact",
        event_id: eventId,
        package_id: "general",
        custom_data: { contact_method: method },
      }),
    }).catch(() => {});
  }
}

export function ContactSection({ settings }: { settings?: any } = {}) {
  const t = useTranslations("contact");
  const tui = useTranslations("ui");
  const locale = useLocale();

  const addressString = settings?.address?.[locale] || settings?.address?.en || t("info.location");
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(addressString)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mx-auto">
          {/* Contact Information */}
          <div className="group">
            <Card className="h-full flex flex-col transition-all duration-300 shadow-sm hover:shadow-md">
              <CardHeader className="px-6 lg:px-8 pt-6 lg:pt-8 pb-4">
                <CardTitle className="text-xl sm:text-2xl text-center lg:text-left text-primary">
                  {tui("contact_information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 px-6 lg:px-8 pb-8 pt-0">
                <div className="space-y-6 sm:space-y-8 mt-2">
                  <div className="flex items-start space-x-4 sm:space-x-5 rtl:space-x-reverse">
                    <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base text-card-foreground">
                        {tui("location")}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {settings?.address?.[locale] || settings?.address?.en || t("info.location")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 sm:space-x-5 rtl:space-x-reverse">
                    <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                      <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base text-card-foreground">
                        {tui("email")}
                      </h3>
                      <a
                        href={`mailto:${settings?.contact_email || t("info.email")}`}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm break-all font-medium"
                        onClick={() => trackContactEvent("Email")}
                      >
                        {settings?.contact_email || t("info.email")}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 sm:space-x-5 rtl:space-x-reverse">
                    <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base text-card-foreground">
                        {tui("phone")}
                      </h3>
                      <a
                        href={`tel:${settings?.contact_phone || t("info.phone")}`}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm phone-number font-medium"
                        onClick={() => trackContactEvent("Phone")}
                      >
                        {settings?.contact_phone || t("info.phone")}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 sm:space-x-5 rtl:space-x-reverse">
                    <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="font-semibold mb-1 text-sm sm:text-base text-card-foreground">
                        {tui("availability")}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {settings?.working_hours?.[locale] || settings?.working_hours?.en || t("info.hours")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dynamic Map Embed */}
          <div className="group h-full min-h-[350px] lg:min-h-full">
            <Card className="h-full w-full overflow-hidden shadow-sm hover:shadow-md border-muted/30 flex p-0">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                className="w-full h-full border-0 min-h-[350px] lg:min-h-full object-cover"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
