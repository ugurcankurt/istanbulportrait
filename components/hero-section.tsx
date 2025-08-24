"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { Camera, MapPin, Star } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export function HeroSection() {
  const t = useTranslations("hero");
  const features = useTranslations("features");
  const tui = useTranslations("ui");

  return (
    <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/istanbul_photographer.jpg"
          alt="Istanbul photoshoot"
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/istanbulportprat_ugur_cankurt.jpg';
            target.onerror = () => {
              target.style.display = 'none';
              const parent = target.closest('.absolute');
              if (parent && parent instanceof HTMLElement) {
                parent.style.backgroundColor = 'rgba(0,0,0,0.7)';
              }
            };
          }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-6xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              {t("title")}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-white/90 px-2">
              {t("subtitle")}
            </p>
            <p className="text-base sm:text-lg mb-8 sm:mb-12 text-white/80 max-w-4xl mx-auto px-4">
              {t("description")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8 sm:mb-16 px-4"
          >
            <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 w-full sm:w-auto min-w-[160px]">
              <Link href="/packages">{tui("packages_button")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 w-full sm:w-auto min-w-[160px] bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
              <Link href="/checkout">{tui("book_your_session")}</Link>
            </Button>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 max-w-6xl mx-auto px-4"
          >
            <div className="text-center p-3 sm:p-6 bg-white/10 backdrop-blur-sm rounded-md sm:rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
              <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">
                {features("rooftop.title")}
              </h3>
              <p className="text-xs sm:text-base text-white/80 leading-relaxed">{features("rooftop.description")}</p>
            </div>

            <div className="text-center p-3 sm:p-6 bg-white/10 backdrop-blur-sm rounded-md sm:rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
              <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">
                {features("historic.title")}
              </h3>
              <p className="text-xs sm:text-base text-white/80 leading-relaxed">
                {features("historic.description")}
              </p>
            </div>

            <div className="text-center p-3 sm:p-6 bg-white/10 backdrop-blur-sm rounded-md sm:rounded-lg border border-white/20 hover:bg-white/15 transition-colors col-span-2 lg:col-span-1">
              <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <Camera className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">
                {features("professional.title")}
              </h3>
              <p className="text-xs sm:text-base text-white/80 leading-relaxed">
                {features("professional.description")}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:block"
      >
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-2 sm:h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}
