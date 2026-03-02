"use client";

import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useConsent } from "@/contexts/consent-context";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const contact = useTranslations("contact.info");
  const tui = useTranslations("ui");
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { setConsent } = useConsent();

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const socialLinks = [
    {
      icon: Instagram,
      href: "https://instagram.com/istanbulportrait",
      label: "Instagram",
    },
    { icon: Mail, href: "mailto:info@istanbulportrait.com", label: "Email" },
  ];

  const quickLinks = [
    { href: "/" as const, label: nav("home") },
    { href: "/packages" as const, label: nav("packages") },
    { href: "/about" as const, label: nav("about") },
    { href: "/contact" as const, label: nav("contact") },
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
                      ? "/istanbulportrait_white_logo.webp"
                      : "/istanbulportrait_dark_logo.webp"
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
                <span>{contact("location")}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Mail className="h-5 w-5 shrink-0" />
                <a
                  href={`mailto:${contact("email")}`}
                  className="hover:text-foreground transition-colors"
                >
                  {contact("email")}
                </a>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Phone className="h-5 w-5 shrink-0" />
                <a
                  href={`tel:${contact("phone")}`}
                  className="hover:text-foreground transition-colors phone-number"
                >
                  {contact("phone")}
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
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("privacy_policy")}
              </Link>
              <Link
                href="/privacy"
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
