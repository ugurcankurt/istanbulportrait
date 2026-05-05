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
  videoUrl?: string | null;
}

const VideoPlayer = ({ url, fit = "cover" }: { url: string; fit?: "cover" | "contain" }) => {
  const embed = React.useMemo(() => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
        const videoId = parsed.searchParams.get("v") || parsed.pathname.split('/').pop();
        return { type: "youtube", src: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0` };
      }
      if (parsed.hostname.includes("vimeo.com")) {
        const videoId = parsed.pathname.split('/').pop();
        return { type: "vimeo", src: `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1` };
      }
      if (parsed.hostname.includes("instagram.com")) {
        let pathname = parsed.pathname;
        if (pathname.startsWith('/reel/')) {
          pathname = pathname.replace('/reel/', '/p/');
        }
        if (!pathname.endsWith('/')) pathname += '/';
        return { type: "instagram", src: `https://www.instagram.com${pathname}embed/` };
      }
      if (url.endsWith(".mp4") || url.endsWith(".webm") || url.includes("supabase.co")) {
        return { type: "mp4", src: url };
      }
    } catch (e) {
      return null;
    }
    return null;
  }, [url]);

  if (!embed) return null;

  if (embed.type === "mp4") {
    return (
      <video
        src={embed.src}
        autoPlay
        loop
        muted
        playsInline
        className={cn("w-full h-full", fit === "cover" ? "object-cover" : "object-contain")}
      />
    );
  }

  if (embed.type === "youtube" || embed.type === "vimeo") {
    if (fit === "cover") {
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <iframe
            src={embed.src}
            className="w-[300%] h-[300%] max-w-none"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            scrolling="no"
          />
        </div>
      );
    }
    return (
      <iframe
        src={embed.src}
        className="w-full h-full object-contain pointer-events-none"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        scrolling="no"
      />
    );
  }

  return (
    <iframe
      src={embed.src}
      className={cn("w-full h-full", embed.type === "instagram" ? "object-contain bg-black" : "object-cover pointer-events-none")}
      frameBorder="0"
      allow="autoplay; encrypted-media"
      allowFullScreen
      scrolling="no"
    />
  );
};

export function PackageGallery({
  images,
  alt,
  onShare,
  onFavorite,
  onBack,
  isFavorite,
  videoUrl,
}: PackageGalleryProps) {
  const t = useTranslations("ui");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  const locale = useLocale();
  const direction = getTextDirection(locale);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    direction: direction
  });

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

  React.useEffect(() => {
    if (isOpen && lightboxApi) {
      lightboxApi.scrollTo(selectedIndex, true);
    }
  }, [isOpen, lightboxApi, selectedIndex]);

  if ((!images || images.length === 0) && !videoUrl) return null;

  const totalItems = images.length + (videoUrl ? 1 : 0);

  return (
    <div className="w-full">
      {/* --- MOBILE VIEW: CAROUSEL --- */}
      <div className="md:hidden relative group bg-black rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex items-stretch">
            {videoUrl && (
              <div className="flex-[0_0_100%] min-w-0 relative aspect-[4/5] bg-black">
                <VideoPlayer url={videoUrl} />
              </div>
            )}
            {images.map((src, index) => (
              <div
                className="flex-[0_0_100%] min-w-0 relative aspect-[4/5] cursor-pointer"
                key={index}
                onClick={() => {
                  setSelectedIndex(videoUrl ? index + 1 : index);
                  setIsOpen(true);
                }}
              >
                <Image
                  src={src}
                  alt={`${alt} - Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={!videoUrl && index === 0}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

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

        <div className="absolute bottom-10 end-4 z-20">
          <Badge variant="secondary" className="bg-black/30 text-white border border-white/20 py-1.5 px-3 text-xs font-semibold backdrop-blur-md shadow-luxury">
            {selectedIndex + 1} / {totalItems}
          </Badge>
        </div>

        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2 z-20 pointer-events-none">
          {Array.from({ length: totalItems }).map((_, i) => (
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
          {/* Main Hero (Video or Image) */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer overflow-hidden bg-black flex items-center justify-center"
            onClick={() => {
              if (!videoUrl) {
                setSelectedIndex(0);
                setIsOpen(true);
              }
            }}
          >
            {videoUrl ? (
              <VideoPlayer url={videoUrl} />
            ) : (
              <Image
                src={images[0]}
                alt={alt}
                fill
                className="object-cover hover:brightness-90 transition-all duration-700 hover:scale-105"
                sizes="(max-width: 1024px) 50vw, (max-width: 1536px) 50vw, 800px"
                priority
              />
            )}
          </div>

          {/* Secondary Images (Grid) */}
          {images.slice(videoUrl ? 0 : 1, videoUrl ? 4 : 5).map((src, index) => (
            <div
              key={index}
              className="relative cursor-pointer overflow-hidden"
              onClick={() => {
                setSelectedIndex(videoUrl ? index + 1 : index + 1);
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

          <div className="absolute bottom-4 end-4 z-20">
            <Button className="bg-white/90 text-black shadow-luxury hover:bg-white backdrop-blur-md border border-white/20 transition-all duration-700 hover:scale-105"
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
          <DialogPrimitive.Popup className="fixed inset-0 z-[120] w-screen h-[100dvh] flex flex-col items-center justify-center outline-none bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
            <DialogTitle className="sr-only">Photo Gallery</DialogTitle>

            <div className="absolute top-0 inset-x-0 h-24 flex items-center justify-end px-4 sm:px-10 z-[130]">
              <div className="absolute left-1/2 -translate-x-1/2">
                <span className="text-slate-900 font-bold text-sm sm:text-base tracking-tight">
                  {selectedIndex + 1} / {totalItems}
                </span>
              </div>
              <DialogClose
                className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white dark:bg-slate-900 shadow-lg border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:scale-110")}
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </DialogClose>
            </div>

            <div className="w-full h-full flex items-center justify-center relative">
              <div className="overflow-hidden w-full h-full" ref={lightboxRef}>
                <div className="flex h-full">
                  {videoUrl && (
                    <div className="flex-[0_0_100%] min-w-0 h-full relative flex items-center justify-center bg-black">
                      <div className="w-full h-full max-w-4xl relative">
                        <VideoPlayer url={videoUrl} fit="contain" />
                      </div>
                    </div>
                  )}
                  {images.map((src, index) => (
                    <div className="flex-[0_0_100%] min-w-0 h-full relative" key={index}>
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={src}
                          alt={`${alt} - Photo ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="100vw"
                          priority={Boolean((!videoUrl && index === selectedIndex) || (videoUrl && index + 1 === selectedIndex))}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
