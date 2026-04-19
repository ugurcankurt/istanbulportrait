"use client";

import { useState } from "react";

import { ArrowLeft, Camera, Home, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NotFoundContentProps {
  locale: string;
  title: string;
  subtitle: string;
  description: string;
  homeButton: string;
  packagesButton: string;
  goBack: string;
  settings?: any;
}

export function NotFoundContent({
  locale,
  title,
  subtitle,
  description,
  homeButton,
  packagesButton,
  goBack,
  settings,
}: NotFoundContentProps) {
  const [imgError, setImgError] = useState(false);
  const bgImage = settings?.default_og_image_url || settings?.founder_image_url;

  return (
    <div className="relative min-h-screen md:min-h-[calc(100vh-140px)] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {!imgError && bgImage && (
          <Image
            src={bgImage}
            alt="Istanbul photoshoot"
            fill
            className="object-cover"
            priority={false}
            quality={75}
            sizes="100vw"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute inset-0 bg-black/50 sm:bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="text-center max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          {/* Logo Section */}
          <div className="mb-6 sm:mb-8 md:mb-10">
            <Link href={`/${locale}`} className="inline-block group">
              <div className="relative transition-transform duration-300 group-hover:scale-105">
                {settings?.logo_dark_url || settings?.logo_url ? (
                  <Image
                    src={settings.logo_dark_url || settings.logo_url!}
                    alt={settings.site_name || "Istanbul Photographer Logo"}
                    width={200}
                    height={56}
                    className="h-6 sm:h-8 md:h-10 lg:h-12 xl:h-14 w-auto mx-auto drop-shadow-lg"
                    priority
                  />
                ) : (
                  <span className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg tracking-wider">
                    {settings?.site_name || "Istanbul Portrait"}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* 404 Number */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-bold text-white/20 leading-none tracking-tighter">
              404
            </h1>
          </div>

          {/* Icon */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 bg-primary/30 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shadow-xl">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight">
            {title}
          </h2>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-2 sm:mb-3 md:mb-4 font-medium">
            {subtitle}
          </p>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-white/70 mb-6 sm:mb-8 md:mb-10 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto leading-relaxed">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center items-center">
            <Button nativeButton={false}
              render={<Link href={`/${locale}`} className="flex items-center gap-2 sm:gap-3" />}
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-xl px-6 sm:px-8"
            >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">
                  {homeButton}
                </span>
            </Button>

            <Button nativeButton={false}
              render={<Link href={`/${locale}/packages`} className="flex items-center gap-2 sm:gap-3" />}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-black sm:px-8"
            >
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">
                  {packagesButton}
                </span>
            </Button>
          </div>

          {/* Back Link */}
          <div className="mt-6 sm:mt-8 md:mt-10">
            <Button
              variant="ghost"
              size="default"
              className="text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 px-4 sm:px-6"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">{goBack}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements - Hidden on Mobile */}
      <div className="hidden md:block absolute top-8 lg:top-12 right-8 lg:right-12 opacity-10">
        <Camera className="w-24 h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 text-white" />
      </div>
      <div className="hidden md:block absolute bottom-8 lg:bottom-12 left-8 lg:left-12 opacity-5">
        <MapPin className="w-20 h-20 lg:w-24 lg:h-24 xl:w-32 xl:h-32 text-white" />
      </div>
    </div>
  );
}
