"use client";
import { ArrowRight, Camera, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/analytics";

export function HeroSection() {
  const t = useTranslations("hero");
  const features = useTranslations("features");
  const tui = useTranslations("ui");

  return (
    <section className="relative min-h-[60vh] sm:min-h-[80vh] overflow-hidden flex items-center justify-center">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/istanbul_photographer.webp"
          alt="Professional Istanbul photographer capturing stunning portrait photography at Bosphorus - Award-winning photography services in Istanbul Turkey"
          fill
          className="object-cover"
          priority
          fetchPriority="high"
          quality={90}
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA3gAA//9k="
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/istanbulportprat_ugur_cankurt.webp";
            target.onerror = () => {
              target.style.display = "none";
              const parent = target.closest(".relative");
              if (parent && parent instanceof HTMLElement) {
                parent.style.backgroundColor = "rgba(0,0,0,0.7)";
              }
            };
          }}
        />
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="max-w-5xl mx-auto text-center text-white">
          <div className="flex flex-col items-center animate-fade-in-up">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md rounded-full transition-colors"
            >
              ✨ Istanbul's Premier Photographer
            </Badge>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight drop-shadow-lg text-white">
              {t("title")}
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed font-light drop-shadow-md">
              {t("subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16 w-full sm:w-auto">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto min-w-[140px] h-12 font-semibold"
                onClick={() => trackEvent("cta_click", "Hero", "View Packages")}
              >
                <Link
                  href="/packages"
                  className="flex items-center justify-center gap-2"
                >
                  {tui("packages_button")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto min-w-[140px] h-12 font-semibold bg-transparent text-white border-white hover:bg-white/10 hover:text-white"
                onClick={() => trackEvent("cta_click", "Hero", "Book Session")}
              >
                <Link href="/locations">{tui("book_your_session")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
