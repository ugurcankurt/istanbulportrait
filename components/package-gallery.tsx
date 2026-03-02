"use client";

import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PackageGalleryProps {
    images: string[];
    alt: string;
}

export function PackageGallery({ images, alt }: PackageGalleryProps) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const scrollPrev = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const onSelect = React.useCallback((emblaApi: any) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, []);

    React.useEffect(() => {
        if (!emblaApi) return;
        onSelect(emblaApi);
        emblaApi.on("select", onSelect);
    }, [emblaApi, onSelect]);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative group">
            {/* Main Carousel */}
            <div className="overflow-hidden rounded-xl border border-border shadow-md bg-muted/20" ref={emblaRef}>
                <div className="flex">
                    {images.map((src, index) => (
                        <div className="flex-[0_0_100%] min-w-0 relative aspect-[4/5]" key={index}>
                            <Image
                                src={src}
                                alt={`${alt} - Photo ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                                priority={index === 0}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="absolute inset-y-0 left-0 flex items-center justify-start pointer-events-none p-2 sm:p-4">
                <Button
                    variant="secondary"
                    size="icon"
                    className="pointer-events-auto h-8 w-8 sm:h-10 sm:w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={scrollPrev}
                >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only">Previous slide</span>
                </Button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center justify-end pointer-events-none p-2 sm:p-4">
                <Button
                    variant="secondary"
                    size="icon"
                    className="pointer-events-auto h-8 w-8 sm:h-10 sm:w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={scrollNext}
                >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only">Next slide</span>
                </Button>
            </div>

            {/* Thumbnails / Indicators */}
            <div className="mt-4 flex justify-center gap-2 px-4 overflow-x-auto pb-2">
                {images.map((src, index) => (
                    <button
                        key={index}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={cn(
                            "relative w-16 h-20 sm:w-24 sm:h-[120px] flex-shrink-0 rounded-md overflow-hidden transition-all duration-300 border-2",
                            index === selectedIndex
                                ? "border-primary opacity-100 ring-2 ring-primary/20"
                                : "border-transparent opacity-60 hover:opacity-100"
                        )}
                    >
                        <Image
                            src={src}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="150px"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
