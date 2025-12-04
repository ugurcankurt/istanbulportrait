"use client";

import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const contact = useTranslations("contact.info");
  const tui = useTranslations("ui");
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Image
                src={
                  mounted && resolvedTheme === "dark"
                    ? "/istanbulportrait_white_logo.png"
                    : "/istanbulportrait_dark_logo.png"
                }
                alt="Professional Istanbul photographer - Top photographer in Istanbul"
                width={90}
                height={24}
                className="h-6 w-auto"
                suppressHydrationWarning
              />
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
            <h4 className="font-semibold">{t("quickLinks")}</h4>
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
            <h4 className="font-semibold">{t("services")}</h4>
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
            <h4 className="font-semibold">{tui("contact")}</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="h-4 w-4" />
                <span>{contact("location")}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${contact("email")}`}
                  className="hover:text-foreground transition-colors"
                >
                  {contact("email")}
                </a>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Phone className="h-4 w-4" />
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
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("privacy_policy")}
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("terms_of_service")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
