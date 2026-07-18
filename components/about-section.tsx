"use client";

import { useState } from "react";

import { Award, Camera, Heart, MapPin, Star, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

interface AboutSectionProps {
  highlightsHeader?: React.ReactNode;
  ctaHeader?: React.ReactNode;
  dbPage?: any;
  locale?: string;
  founderImageUrl?: string | null;
}

export function AboutSection({
  highlightsHeader,
  ctaHeader,
  dbPage,
  locale = "en",
  founderImageUrl,
}: AboutSectionProps) {
  const [imgError, setImgError] = useState(false);

  const tabout = useTranslations("about");
  const tui = useTranslations("ui");
  const taboutHighlights = useTranslations("about_highlights");
  const taboutCta = useTranslations("about_cta");

  const dynAbout = dbPage?.content?.about;

  const stats = [
    {
      icon: Camera,
      number: dynAbout?.stats?.[0]?.number || "8+",
      label: dynAbout?.stats?.[0]?.label?.[locale] || tabout("experience"),
    },
    {
      icon: Users,
      number: dynAbout?.stats?.[1]?.number || "500+",
      label: dynAbout?.stats?.[1]?.label?.[locale] || tabout("clients"),
    },
    {
      icon: Heart,
      number: dynAbout?.stats?.[2]?.number || "100%",
      label: dynAbout?.stats?.[2]?.label?.[locale] || tabout("satisfaction"),
    },
  ];

  const highlights = [
    {
      icon: Award,
      title: dynAbout?.highlights?.[0]?.title?.[locale] || taboutHighlights("professional_quality"),
      description: dynAbout?.highlights?.[0]?.description?.[locale] || taboutHighlights("professional_quality_desc"),
    },
    {
      icon: MapPin,
      title: dynAbout?.highlights?.[1]?.title?.[locale] || taboutHighlights("local_knowledge"),
      description: dynAbout?.highlights?.[1]?.description?.[locale] || taboutHighlights("local_knowledge_desc"),
    },
    {
      icon: Star,
      title: dynAbout?.highlights?.[2]?.title?.[locale] || taboutHighlights("personalized_experience"),
      description: dynAbout?.highlights?.[2]?.description?.[locale] || taboutHighlights("personalized_experience_desc"),
    },
  ];

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center mx-auto mb-12 sm:mb-16 lg:mb-20">
          {/* Image */}
          <div className="relative">
            <div className="relative aspect-[4/5] rounded-[2.5rem] border-[0.5px] border-border/50 shadow-md overflow-hidden bg-muted flex flex-col items-center justify-center">
              {(!imgError && (dbPage?.cover_image || founderImageUrl)) ? (
                <Image
                  src={dbPage?.cover_image || founderImageUrl || ""}
                  alt={dbPage?.title?.[locale] || "Uğur Cankurt - Professional Istanbul Photographer"}
                  fill
                  className="object-cover"
                  priority={true}
                  quality={75}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4 py-32">
                  <Camera className="w-12 h-12 opacity-50" />
                  <span className="text-sm font-medium">Founder Portrait</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
            <div className="absolute -bottom-4 sm:-bottom-6 -right-4 sm:-right-6 bg-primary text-primary-foreground p-4 sm:p-5 rounded-2xl shadow-xl border-4 border-background">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3">
              <p className="text-muted-foreground/90 font-light text-base md:text-lg lg:text-xl leading-relaxed lg:leading-loose whitespace-pre-wrap">
                {dynAbout?.description?.[locale] || tabout("description")}
              </p>
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
              <Button nativeButton={false}
                render={<Link href={"/packages" as any} />}
                size="sm"
                className="sm:size-lg text-xs sm:text-sm"
              >
                {tui("view_my_work")}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mx-auto mb-12 sm:mb-16 lg:mb-20">
          {stats.map((stat, i) => (
            <div key={`stat-${stat.label}-${i}`} className="group">
              <Card className="text-center p-6 sm:p-8 lg:p-10 rounded-[2rem] border-[0.5px] border-border/50 shadow-sm transition-all duration-500 hover:shadow-md hover:border-primary/30 bg-background">
                <CardContent className="p-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-[1.5rem] bg-primary/5 border-[0.5px] border-primary/20 shadow-sm flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
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
        <div className="mx-auto">
          {highlightsHeader}

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {highlights.map((highlight, i) => (
              <div key={`highlight-${highlight.title}-${i}`} className="group">
                <Card className="text-center p-6 sm:p-8 rounded-[2rem] border-[0.5px] border-border/50 shadow-sm transition-all duration-500 hover:shadow-md hover:border-primary/30 bg-background h-full flex flex-col justify-center">
                  <CardContent className="p-0 flex flex-col items-center flex-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-4 sm:mb-6 rounded-2xl bg-primary/5 border-[0.5px] border-primary/20 shadow-sm flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
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
        <div className="text-center mt-12 sm:mt-16 lg:mt-20">
          <div className="border-[0.5px] border-border/50 bg-primary/5 shadow-sm rounded-[2rem] lg:rounded-[3rem] p-10 sm:p-12 lg:p-16 mx-auto max-w-4xl">
            {ctaHeader}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button nativeButton={false}
                render={<Link href={"/locations" as any} />}
                size="lg"
                className="h-12 px-8 rounded-xl font-bold"
              >
                {tui("check_locations")}
              </Button>
              <Button nativeButton={false}
                render={<Link href={"/packages" as any} />}
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl font-bold bg-background/50 border-border/50"
              >
                {tui("view_packages")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
