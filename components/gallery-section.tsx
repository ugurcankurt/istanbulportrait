"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  category: string;
}

interface GallerySectionProps {
  header?: React.ReactNode;
  images: GalleryImage[];
}

export function GallerySection({ header, images = [] }: GallerySectionProps) {

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [randomImages, setRandomImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    // Shuffle images and select first 8 to show continuously changing images on every load
    const shuffled = [...images].sort(() => 0.5 - Math.random());
    setRandomImages(shuffled.slice(0, 8));
    setMounted(true);
  }, [images]);

  const displayImages = mounted ? randomImages : images.slice(0, 8);

  const openLightbox = (imageId: string) => {
    setSelectedImage(imageId);
    setIsDialogOpen(true);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return;

    const currentIndex = displayImages.findIndex(
      (img) => img.id === selectedImage,
    );
    let newIndex;

    if (direction === "next") {
      newIndex = (currentIndex + 1) % displayImages.length;
    } else {
      newIndex =
        (currentIndex - 1 + displayImages.length) % displayImages.length;
    }

    setSelectedImage(displayImages[newIndex].id);
  };

  const selectedImageData = displayImages.find(
    (img) => img.id === selectedImage,
  );

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {header}

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6 lg:gap-8 mx-auto">
          {displayImages.map((image, index) => (
            <div
              key={image.id}
              id={`gallery-image-${image.id}`}
              className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer ${index >= 6 ? "hidden md:block" : ""
                }`}
            >
              <Dialog>
                <DialogTrigger
                  onClick={() => openLightbox(image.id)}
                  className="relative w-full h-full border-0 p-0 bg-transparent cursor-pointer group-hover:scale-100"
                  aria-label={`View ${image.alt} in fullscreen`}
                  type="button"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 639px) 48vw, (max-width: 1023px) 48vw, (max-width: 1279px) 31vw, 22vw"
                    quality={50}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>
                </DialogTrigger>
              </Dialog>
            </div>
          ))}
        </div>

        {/* Lightbox Dialog */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedImage(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95">
            <DialogTitle className="sr-only">
              {selectedImageData?.alt}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Gallery image lightbox
            </DialogDescription>
            {selectedImageData && (
              <div className="relative">
                <div className="relative aspect-auto max-h-[80vh]">
                  <Image
                    src={selectedImageData.src}
                    alt={selectedImageData.alt}
                    width={800}
                    height={600}
                    quality={75}
                    className="object-contain w-full h-full"
                    onError={() => {
                      // Image loading failed, fallback handled by browser
                    }}
                  />
                </div>

                {/* Navigation */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70"
                  onClick={() => navigateImage("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 border-white/20 text-white hover:bg-black/70"
                  onClick={() => navigateImage("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
