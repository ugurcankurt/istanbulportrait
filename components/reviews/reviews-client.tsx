"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Star, ExternalLink, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { GoogleReview, AggregateRating } from "@/types/reviews";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

interface ReviewsClientProps {
  reviews: GoogleReview[];
  aggregateRating: AggregateRating;
}

export function ReviewsClient({ reviews, aggregateRating }: ReviewsClientProps) {
  const t = useTranslations("reviews");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate reviews every 5 seconds
  useEffect(() => {
    if (reviews.length > 1 && isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [reviews.length, isAutoPlaying]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4", 
      lg: "w-5 h-5"
    };

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
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
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 sm:mb-8 px-2">
            {t("subtitle")}
          </p>

          {/* Aggregate Rating Display */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              {renderStars(Math.round(aggregateRating.average), "lg")}
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                {aggregateRating.average}
              </span>
            </div>
            <div className="text-sm sm:text-lg text-muted-foreground">
              <span className="font-semibold text-foreground">{aggregateRating.count}</span> {t("total_reviews")}
            </div>
          </div>
        </motion.div>

        {/* Reviews Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Arrows - Hidden on mobile, visible on tablet+ */}
          {reviews.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-0 sm:left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/90 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 hidden sm:flex items-center justify-center"
                aria-label="Previous review"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 sm:right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-background/90 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 hidden sm:flex items-center justify-center"
                aria-label="Next review"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl px-4 sm:px-8 md:px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full"
              >
                {reviews[currentIndex] && (
                  <Card className="bg-gradient-to-br from-background/95 to-muted/20 backdrop-blur-sm border border-border/50 shadow-lg sm:shadow-xl">
                    <CardHeader className="pb-3 sm:pb-4 md:pb-6 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8">
                      <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                        {/* User Avatar */}
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 shrink-0">
                          {reviews[currentIndex].author.photoUrl ? (
                            <Image
                              src={reviews[currentIndex].author.photoUrl!}
                              alt={reviews[currentIndex].author.name}
                              width={64}
                              height={64}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                              {reviews[currentIndex].author.name.charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1 sm:mb-2">
                            {reviews[currentIndex].author.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 md:gap-4">
                            {renderStars(reviews[currentIndex].rating, "sm")}
                            <span className="text-xs sm:text-sm md:text-base text-muted-foreground">
                              {formatDate(reviews[currentIndex].date)}
                            </span>
                          </div>
                        </div>

                        {/* Quote Icon */}
                        <Quote className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary/20 shrink-0" />
                      </div>
                    </CardHeader>

                    <CardContent className="px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
                      <blockquote className="text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed text-muted-foreground italic">
                        "{reviews[currentIndex].text}"
                      </blockquote>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Review Indicators */}
          {reviews.length > 1 && (
            <div className="flex justify-center gap-2 mt-6 sm:mt-8">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsAutoPlaying(false);
                    setTimeout(() => setIsAutoPlaying(true), 10000);
                  }}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    index === currentIndex
                      ? "bg-primary scale-125"
                      : "bg-muted-foreground/40 hover:bg-muted-foreground/70 hover:scale-110"
                  }`}
                  aria-label={`Go to review ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Reviews Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center mt-8 sm:mt-12 md:mt-16"
        >
          <Button
            variant="outline"
            size="lg"
            className="group px-6 sm:px-8 py-3 sm:py-4 md:py-6 text-sm sm:text-base md:text-lg font-semibold bg-background/90 backdrop-blur-sm border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 shadow-lg hover:shadow-xl"
            asChild
          >
            <a
              href="https://maps.app.goo.gl/Q2v1FDMw5LJHBBCA9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 sm:gap-3"
            >
              <span>{t("view_all")}</span>
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}