"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Camera, Instagram, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const contact = useTranslations("contact.info");
  const tui = useTranslations("ui");

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
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Camera className="h-6 w-6" />
              <span className="font-bold text-lg">Istanbul Portrait</span>
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
            <h3 className="font-semibold">{t("quickLinks")}</h3>
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
            <h3 className="font-semibold">{t("services")}</h3>
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
            <h3 className="font-semibold">{tui("contact")}</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{contact("location")}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${contact("email")}`}
                  className="hover:text-foreground transition-colors"
                >
                  {contact("email")}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <a
                  href={`tel:${contact("phone")}`}
                  className="hover:text-foreground transition-colors"
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
