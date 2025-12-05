"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const galleryImages = [
  {
    id: 1,
    src: "/gallery/couple_photoshoot_in_istanbul.jpg",
    alt: "Professional couple photoshoot Istanbul Balat romantic session with city skyline",
    category: "couple",
  },
  {
    id: 2,
    src: "/gallery/istanbul_couple_photoshoot_1.jpg",
    alt: "Istanbul couple photography session romantic poses historic Galata Tower professional photographer",
    category: "couple",
  },
  {
    id: 3,
    src: "/gallery/istanbul_couple_photoshoot.jpg",
    alt: "Istanbul ortaköy couple photoshoot panoramic city view Bosphorus professional photography session",
    category: "couple",
  },
  {
    id: 4,
    src: "/gallery/istanbul_photographer_1.jpg",
    alt: "Professional Istanbul photographer portrait session premium quality studio lighting techniques",
    category: "company",
  },
  {
    id: 5,
    src: "/gallery/istanbul_rooftop_photoshoot_1.jpg",
    alt: "Istanbul rooftop photoshoot city skyline panoramic view professional photographer sunset session",
    category: "rooftop",
  },
  {
    id: 6,
    src: "/gallery/istanbul_rooftop_photoshoot.jpg",
    alt: "Couple rooftop photoshoot Istanbul Galata Tower view romantic session professional photographer",
    category: "rooftop",
  },
  {
    id: 7,
    src: "/gallery/istanbul_wedding_photographer_1.jpg",
    alt: "Istanbul wedding photographer professional ceremony photography Ortaköy historic venue",
    category: "wedding",
  },
  {
    id: 8,
    src: "/gallery/istanbul_wedding_photographer.jpg",
    alt: "Professional wedding photography Istanbul historic landmarks Blue Mosque ceremony session",
    category: "wedding",
  },
];

export function GallerySection() {
  const t = useTranslations("gallery");
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openLightbox = (imageId: number) => {
    setSelectedImage(imageId);
    setIsDialogOpen(true);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (selectedImage === null) return;

    const currentIndex = galleryImages.findIndex(
      (img) => img.id === selectedImage,
    );
    let newIndex;

    if (direction === "next") {
      newIndex = (currentIndex + 1) % galleryImages.length;
    } else {
      newIndex =
        (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    }

    setSelectedImage(galleryImages[newIndex].id);
  };

  const selectedImageData = galleryImages.find(
    (img) => img.id === selectedImage,
  );

  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            {t("title")}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            {t("subtitle")}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground/80 max-w-4xl mx-auto px-4 mt-4">
            {t("intro")}
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto"
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              id={`gallery-image-${image.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
            >
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    onClick={() => openLightbox(image.id)}
                    className="relative w-full h-full border-0 p-0 bg-transparent cursor-pointer"
                    aria-label={`View ${image.alt} in fullscreen`}
                    type="button"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
                  </button>
                </DialogTrigger>
              </Dialog>
            </motion.div>
          ))}
        </motion.div>

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
