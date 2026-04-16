"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Heart,
  Share2,
  X,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations, useLocale } from "next-intl";
import { getTextDirection } from "@/lib/utils";

interface PackageGalleryProps {
  images: string[];
  alt: string;
  onShare?: () => void;
  onFavorite?: () => void;
  onBack?: () => void;
  isFavorite?: boolean;
}

export function PackageGallery({
  images,
  alt,
  onShare,
  onFavorite,
  onBack,
  isFavorite,
}: PackageGalleryProps) {
  const t = useTranslations("ui");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  const locale = useLocale();
  const direction = getTextDirection(locale);

  // Mobile Carousel State
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    direction: direction
  });

  // Lightbox Carousel State
  const [lightboxRef, lightboxApi] = useEmblaCarousel({
    loop: true,
    startIndex: selectedIndex,
    direction: direction
  });

  const onSelect = React.useCallback((api: any) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => onSelect(emblaApi));
  }, [emblaApi, onSelect]);

  React.useEffect(() => {
    if (!lightboxApi) return;
    lightboxApi.on("select", () => onSelect(lightboxApi));
  }, [lightboxApi, onSelect]);

  // Sync index when opening lightbox
  React.useEffect(() => {
    if (isOpen && lightboxApi) {
      lightboxApi.scrollTo(selectedIndex, true);
    }
  }, [isOpen, lightboxApi, selectedIndex]);

  if (!images || images.length === 0) return null;

  const displayImages = images.slice(0, 5);
  const totalImages = images.length;

  return (
    <div className="w-full">
      {/* --- MOBILE VIEW: CAROUSEL --- */}
      <div className="md:hidden relative group bg-black rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {images.map((src, index) => (
              <div
                className="flex-[0_0_100%] min-w-0 relative aspect-[4/5] cursor-pointer"
                key={index}
                onClick={() => {
                  setSelectedIndex(index);
                  setIsOpen(true);
                }}
              >
                <Image
                  src={src}
                  alt={`${alt} - Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Top Gradient Overlay */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />

        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

        {/* Overlay Top Bar */}
        {(onShare || onFavorite || onBack) && (
          <div className="absolute top-4 inset-x-4 flex justify-between items-start z-20">
            {onBack ? (
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full shadow-lg bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100 h-9 w-9"
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
              >
                <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              {onShare && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow-lg bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100 h-9 w-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              {onFavorite && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow-lg bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100 h-9 w-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite();
                  }}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isFavorite ? "fill-primary text-primary" : ""
                    )}
                  />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Floating Image Counter */}
        <div className="absolute bottom-10 end-4 z-20">
          <Badge variant="secondary" className="bg-primary/40 text-white border-none py-1.5 px-3 text-xs font-semibold backdrop-blur-md">
            {selectedIndex + 1} / {totalImages}
          </Badge>
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2 z-20 pointer-events-none">
          {images.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                i === selectedIndex ? "bg-white scale-125 w-3" : "bg-white/50 scale-100"
              )}
            />
          ))}
        </div>
      </div>

      {/* --- DESKTOP VIEW: PREMIUM GRID --- */}
      <div className="hidden md:block">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[360px] lg:h-[470px] w-full overflow-hidden rounded-2xl relative group/grid">
          {/* Main Image */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden"
            onClick={() => {
              setSelectedIndex(0);
              setIsOpen(true);
            }}
          >
            <Image
              src={images[0]}
              alt={alt}
              fill
              className="object-cover hover:brightness-90 transition-all duration-700 hover:scale-105"
              sizes="(max-width: 1024px) 50vw, (max-width: 1536px) 50vw, 800px"
              priority
            />
          </div>

          {/* Secondary Images (Grid) */}
          {images.slice(1, 5).map((src, index) => (
            <div
              key={index}
              className="relative cursor-pointer overflow-hidden"
              onClick={() => {
                setSelectedIndex(index + 1);
                setIsOpen(true);
              }}
            >
              <Image
                src={src}
                alt={`${alt} ${index + 2}`}
                fill
                className="object-cover hover:brightness-90 transition-all duration-700 hover:scale-105"
                quality={75}
                sizes="(max-width: 1024px) 25vw, (max-width: 1536px) 25vw, 400px"
              />
            </div>
          ))}

          {/* Global "View all photos" button */}
          <div className="absolute bottom-4 end-4 z-20">
            <Button className="primary"
              onClick={() => {
                setSelectedIndex(0);
                setIsOpen(true);
              }}
            >
              <Grid className="h-4 w-4" />
              <span>{t("show_all_photos")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* --- LIGHTBOX DIALOG --- */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-[110] bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Popup className="fixed inset-0 z-[120] w-screen h-screen flex flex-col items-center justify-center outline-none bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
            <DialogTitle className="sr-only">Photo Gallery</DialogTitle>

            {/* Header Controls */}
            <div className="absolute top-0 inset-x-0 h-24 flex items-center justify-end px-4 sm:px-10 z-[130]">
              {/* Counter Top Center */}
              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="text-slate-900 font-bold text-sm sm:text-base tracking-tight">
                  {selectedIndex + 1} / {totalImages}
                </span>
              </div>

              {/* Close Button Top Right */}
              <DialogClose
                className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white dark:bg-slate-900 shadow-lg border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-110")}
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </DialogClose>
            </div>

            {/* Lightbox Carousel Content */}
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="overflow-hidden w-full h-full" ref={lightboxRef}>
                <div className="flex h-full">
                  {images.map((src, index) => (
                    <div className="flex-[0_0_100%] min-w-0 h-full relative" key={index}>
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={src}
                          alt={`${alt} - Photo ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="100vw"
                          priority={index === selectedIndex}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Side Navigation */}
              <div className="absolute start-4 sm:start-10 top-1/2 -translate-y-1/2 z-[130]">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white dark:bg-slate-900 shadow-lg border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-110"
                  onClick={() => lightboxApi?.scrollPrev()}
                >
                  <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8 rtl:rotate-180" />
                </Button>
              </div>
              <div className="absolute end-4 sm:end-10 top-1/2 -translate-y-1/2 z-[130]">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white dark:bg-slate-900 shadow-lg border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-110"
                  onClick={() => lightboxApi?.scrollNext()}
                >
                  <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </Dialog>
    </div>
  );
}
