"use client";

import { motion } from "framer-motion";
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
    <section className="relative min-h-[90vh] sm:min-h-screen overflow-hidden flex items-center justify-center">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/istanbul_photographer.jpg"
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
            target.src = "/istanbulportprat_ugur_cankurt.jpg";
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
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
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

            {/* Description */}
            <p className="text-base sm:text-lg mb-10 text-white/80 max-w-2xl mx-auto hidden sm:block">
              {t("description")}
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
          </motion.div>

          {/* Features Grid with Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 max-w-5xl mx-auto"
          >
            {/* Feature 1 */}
            <Card className="bg-black/20 backdrop-blur-md border-white/10 text-white hover:bg-black/30 transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-3 sm:p-6 flex flex-col items-center text-center h-full">
                <div className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-white block">
                  {features("rooftop.title")}
                </span>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed hidden sm:block">
                  {features("rooftop.description")}
                </p>
                <p className="text-[10px] text-white/70 leading-tight sm:hidden">
                  {features("rooftop.description").length > 50
                    ? features("rooftop.description").substring(0, 50) + "..."
                    : features("rooftop.description")}
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-black/20 backdrop-blur-md border-white/10 text-white hover:bg-black/30 transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-3 sm:p-6 flex flex-col items-center text-center h-full">
                <div className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Star className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-white block">
                  {features("historic.title")}
                </span>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed hidden sm:block">
                  {features("historic.description")}
                </p>
                <p className="text-[10px] text-white/70 leading-tight sm:hidden">
                  {features("historic.description").length > 50
                    ? features("historic.description").substring(0, 50) + "..."
                    : features("historic.description")}
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 - Full Width on Mobile */}
            <Card className="col-span-2 sm:col-span-1 bg-black/20 backdrop-blur-md border-white/10 text-white hover:bg-black/30 transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-3 sm:p-6 flex flex-col items-center text-center h-full">
                <div className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2 text-white block">
                  {features("professional.title")}
                </span>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed hidden sm:block">
                  {features("professional.description")}
                </p>
                <p className="text-[10px] text-white/70 leading-tight sm:hidden">
                  {features("professional.description").length > 80
                    ? features("professional.description").substring(0, 80) + "..."
                    : features("professional.description")}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
