"use client";

import { Award, Camera, Heart, MapPin, Star, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

export function AboutSection() {
  const t = useTranslations("about");
  const tui = useTranslations("ui");
  const taboutHighlights = useTranslations("about_highlights");
  const taboutCta = useTranslations("about_cta");

  const stats = [
    {
      icon: Camera,
      number: "8+",
      label: t("experience"),
    },
    {
      icon: Users,
      number: "500+",
      label: t("sessions"),
    },
    {
      icon: Heart,
      number: "100%",
      label: t("clients"),
    },
  ];

  const highlights = [
    {
      icon: Award,
      title: taboutHighlights("professional.title"),
      description: taboutHighlights("professional.description"),
    },
    {
      icon: MapPin,
      title: taboutHighlights("local.title"),
      description: taboutHighlights("local.description"),
    },
    {
      icon: Star,
      title: taboutHighlights("personal.title"),
      description: taboutHighlights("personal.description"),
    },
  ];

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mx-auto mb-12 sm:mb-16 lg:mb-20">
          {/* Image */}
          <div className="relative animate-scale-in hover-scale">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              <Image
                src="/istanbulportprat_ugur_cankurt.webp"
                alt="Uğur Cankurt - Professional Istanbul Photographer with 8+ years experience in portrait, couple, and rooftop photography sessions"
                fill
                className="object-cover"
                priority={true}
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/istanbul_photographer.webp";
                  target.onerror = () => {
                    target.style.display = "none";
                    const parent = target.closest(".relative");
                    if (parent && parent instanceof HTMLElement) {
                      const fallback = document.createElement("div");
                      fallback.className =
                        "absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center";
                      fallback.innerHTML =
                        '<div class="text-primary font-medium">Image Loading...</div>';
                      parent.appendChild(fallback);
                    }
                  };
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="absolute -bottom-2 sm:-bottom-4 -right-2 sm:-right-4 bg-primary text-primary-foreground p-3 sm:p-4 rounded-lg shadow-lg">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up animation-delay-200">
            <div className="space-y-3">
              <p className="text-sm sm:text-base lg:text-lg leading-relaxed">
                {t("description")}
              </p>
              <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <strong className="text-primary">
                  Professional Expertise:
                </strong>{" "}
                Specializing in portrait photography, couple sessions, rooftop
                photoshoots with stunning Bosphorus views, and lifestyle
                photography across Istanbul's most iconic locations including
                Sultanahmet, Galata Tower, and Ortaköy Mosque.
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {tui("portrait_photography")}
              </Badge>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {tui("couple_sessions")}
              </Badge>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {tui("lifestyle")}
              </Badge>
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {tui("rooftop_shoots")}
              </Badge>
            </div>

            <div className="pt-2 sm:pt-4">
              <Button
                asChild
                size="sm"
                className="sm:size-lg text-xs sm:text-sm"
              >
                <Link href="/packages">{tui("view_my_work")}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mx-auto mb-12 sm:mb-16 lg:mb-20 stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className="hover-scale">
              <Card className="text-center p-4 sm:p-6 lg:p-8">
                <CardContent className="p-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                    {stat.number}
                  </div>
                  <p className="text-muted-foreground font-medium text-xs sm:text-sm">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Highlights */}
        <div className="mx-auto animate-fade-in-up">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-8 sm:mb-10 lg:mb-12">
            {taboutHighlights("title")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 stagger-children">
            {highlights.map((highlight) => (
              <div key={highlight.title} className="hover-scale">
                <Card className="text-center p-4 sm:p-5 lg:p-6">
                  <CardContent className="p-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <highlight.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
                      {highlight.title}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                      {highlight.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 sm:mt-16 lg:mt-20 animate-fade-in-up animation-delay-400">
          <div className="bg-muted/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-12 mx-auto hover-scale">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
              {taboutCta("title")}
            </h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg px-2">
              {taboutCta("description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                asChild
                size="sm"
                className="sm:size-lg text-xs sm:text-sm"
              >
                <Link href="/locations">{tui("book_your_session")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="sm:size-lg text-xs sm:text-sm"
              >
                <Link href="/packages">{tui("view_packages")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
