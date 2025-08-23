"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const galleryImages = [
  {
    id: 1,
    src: "/gallery/couple_photoshoot_in_istanbul.jpg",
    alt: "Istanbul Couple Photoshoot",
    category: "portrait"
  },
  {
    id: 2,
    src: "/gallery/istanbul_couple_photoshoot_1.jpg", 
    alt: "Istanbul Couple Photoshoot",
    category: "couple"
  },
  {
    id: 3,
    src: "/gallery/istanbul_couple_photoshoot.jpg",
    alt: "Istanbul Couple Photohoot", 
    category: "rooftop"
  },
  {
    id: 4,
    src: "/gallery/istanbul_photographer_1.jpg",
    alt: "Istanbul Photographer",
    category: "company"
  },
  {
    id: 5,
    src: "/gallery/istanbul_rooftop_photoshoot_1.jpg",
    alt: "Istanbul Rooftop Photographer",
    category: "portrait"
  },
  {
    id: 6,
    src: "/gallery/istanbul_rooftop_photoshoot.jpg",
    alt: "Istanbul Rooftop Photoshoot", 
    category: "couple"
  },
  {
    id: 7,
    src: "/gallery/istanbul_wedding_photographer_1.jpg",
    alt: "Istanbul Wedding Photographer",
    category: "wedding"
  },
  {
    id: 8,
    src: "/gallery/istanbul_wedding_photographer.jpg",
    alt: "Istanbul Wedding Photographer",
    category: "wedding"
  }
];

export function GallerySection() {
  const t = useTranslations("gallery");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId);
    setIsDialogOpen(true);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setIsDialogOpen(false);
  };

  const goToPrevious = () => {
    if (selectedImage && selectedImage > 1) {
      setSelectedImage(selectedImage - 1);
    } else {
      setSelectedImage(galleryImages.length);
    }
  };

  const goToNext = () => {
    if (selectedImage && selectedImage < galleryImages.length) {
      setSelectedImage(selectedImage + 1);
    } else {
      setSelectedImage(1);
    }
  };

  const selectedImageData = galleryImages.find(img => img.id === selectedImage);

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">{t("title")}</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            {t("subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
              onClick={() => openLightbox(image.id)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl w-full h-full md:h-auto p-0 bg-black/95">
            <DialogTitle className="sr-only">
              {selectedImageData?.alt || "Gallery Image"}
            </DialogTitle>
            {selectedImageData && (
              <div className="relative w-full h-full flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>

                <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center p-8">
                  <Image
                    src={selectedImageData.src}
                    alt={selectedImageData.alt}
                    width={1200}
                    height={800}
                    className="object-contain max-w-full max-h-full rounded-lg"
                    priority
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}