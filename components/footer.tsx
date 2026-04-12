"use client";

import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useConsent } from "@/contexts/consent-context";
import { Link } from "@/i18n/routing";

interface FooterProps {
  dynamicNavData?: Record<string, { path: string; title: string | null }>;
  settings?: any;
}

export function Footer({ dynamicNavData = {}, settings }: FooterProps) {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  const tui = useTranslations("ui");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { setConsent } = useConsent();

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const socialLinks = [
    ...(settings?.instagram_url ? [{ icon: Instagram, href: settings.instagram_url, label: "Instagram" }] : []),
    ...(settings?.facebook_url ? [{ icon: Facebook, href: settings.facebook_url, label: "Facebook" }] : []),
    { icon: Mail, href: `mailto:${settings?.contact_email || "info@istanbulphotosession.com.tr"}`, label: "Email" },
  ];

  const quickLinks = [
    { href: "/" as const, label: nav("home") },
    { href: `/${dynamicNavData.packages?.path || "packages"}` as any, label: dynamicNavData.packages?.title || nav("packages") },
    { href: `/${dynamicNavData.about?.path || "about"}` as any, label: dynamicNavData.about?.title || nav("about") },
    { href: `/${dynamicNavData.contact?.path || "contact"}` as any, label: dynamicNavData.contact?.title || nav("contact") },
  ];

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="w-32 sm:w-40">
              <AspectRatio ratio={15 / 4}>
                <Image
                  src={
                    mounted && resolvedTheme === "dark"
                      ? settings?.logo_dark_url || "/istanbulportrait_white_logo.webp"
                      : settings?.logo_url || "/istanbulportrait_dark_logo.webp"
                  }
                  alt="Professional Istanbul photographer - Top photographer in Istanbul"
                  fill
                  sizes="(max-width: 640px) 128px, 160px"
                  className="object-contain"
                  suppressHydrationWarning
                />
              </AspectRatio>
            </div>
            <p className="text-muted-foreground text-sm">{t("description")}</p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <p className="font-semibold">{t("quickLinks")}</p>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <p className="font-semibold">{t("services")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{tui("portrait_photography")}</li>
              <li>{tui("couple_sessions")}</li>
              <li>{tui("rooftop_shoots")}</li>
              <li>{t("service_items.historic_shoots")}</li>
              <li>{tui("lifestyle")}</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <p className="font-semibold">{tui("contact")}</p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start space-x-2 rtl:space-x-reverse">
                <MapPin className="h-5 w-5 shrink-0" />
                <span>{settings?.address?.[locale] || "Istanbul, Turkey"}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Mail className="h-5 w-5 shrink-0" />
                <a
                  href={`mailto:${settings?.contact_email || "info@istanbulphotosession.com"}`}
                  className="hover:text-foreground transition-colors"
                >
                  {settings?.contact_email || "info@istanbulphotosession.com"}
                </a>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Phone className="h-5 w-5 shrink-0" />
                <a
                  href={`tel:${settings?.contact_phone || "+90 536 709 37 24"}`}
                  className="hover:text-foreground transition-colors phone-number"
                >
                  {settings?.contact_phone || "+90 536 709 37 24"}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">{t("copyright")}</p>
            <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
              <Link
                href={`/${dynamicNavData.privacy?.path || "privacy"}` as any}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {dynamicNavData.privacy?.title || t("privacy_policy")}
              </Link>
              <Link
                href={`/${dynamicNavData.privacy?.path || "privacy"}#terms` as any}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("terms_of_service")}
              </Link>
              <button
                onClick={() => {
                  setConsent(null);
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                  });
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                {tui("cookie_settings")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
