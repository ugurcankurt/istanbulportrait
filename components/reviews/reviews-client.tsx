"use client";

import { motion } from "framer-motion";
import { Star, ExternalLink, Quote } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { GoogleReview, AggregateRating } from "@/types/reviews";
import { ReviewsSchema } from "@/components/seo/reviews-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ReviewsClientProps {
  reviews: GoogleReview[];
  aggregateRating: AggregateRating;
}

export function ReviewsClient({
  reviews,
  aggregateRating,
}: ReviewsClientProps) {
  const t = useTranslations("reviews");

  // Responsive text truncation based on screen size
  const getResponsiveText = (text: string) => {
    // Server-side fallback - return original text
    if (typeof window === "undefined") return text;

    const screenWidth = window.innerWidth;
    let maxLength = 150; // default

    if (screenWidth < 640)
      maxLength = 120; // mobile
    else if (screenWidth < 1024)
      maxLength = 140; // tablet
    else maxLength = 160; // desktop

    if (text.length <= maxLength) return text;

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace === -1) return truncated + "...";
    return truncated.substring(0, lastSpace) + "...";
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                : "fill-gray-300 text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Transform reviews data for schema
  const reviewsForSchema = reviews.map((review) => ({
    author:
      typeof review.author === "string" ? review.author : review.author.name,
    rating: review.rating,
    review: review.text,
    date: review.date,
  }));

  return (
    <>
      {/* Reviews Schema for SEO */}
      <ReviewsSchema
        reviews={reviewsForSchema}
        aggregateRating={{
          ratingValue: aggregateRating.average,
          reviewCount: aggregateRating.count,
          bestRating: 5,
          worstRating: 1,
        }}
      />

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

            {/* Aggregate Rating Display */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mt-6 sm:mt-8">
              <div className="flex items-center gap-2 sm:gap-3">
                {renderStars(Math.round(aggregateRating.average), "lg")}
              </div>
            </div>
          </motion.div>

          {/* Reviews Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {reviews.map((review, index) => (
                  <CarouselItem
                    key={review.id || index}
                    className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    >
                      <Card className="h-full min-h-[280px] flex flex-col">
                        <CardHeader className="relative pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {/* User Avatar */}
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                {review.author.photoUrl ? (
                                  <Image
                                    src={review.author.photoUrl}
                                    alt={review.author.name}
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-muted-foreground">
                                    {review.author.name.charAt(0)}
                                  </span>
                                )}
                              </div>

                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-foreground mb-2">
                                  {review.author.name}
                                </h3>
                                <div className="flex items-center gap-2 mb-1">
                                  {renderStars(review.rating, "sm")}
                                  <span className="text-xs font-medium text-primary/80">
                                    {review.rating}/5
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {formatDate(review.date)}
                                </span>
                              </div>
                            </div>

                            {/* Quote Icon */}
                            <Quote className="w-6 h-6 text-primary/30 shrink-0 mt-1" />
                          </div>
                        </CardHeader>

                        <CardContent className="relative pt-0 flex-1 flex flex-col justify-center">
                          <div className="relative">
                            {/* Quote */}
                            <blockquote className="text-sm leading-relaxed text-muted-foreground italic font-medium relative pl-4 min-h-[4rem] flex items-center">
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
                              <span className="relative z-10">
                                "{getResponsiveText(review.text)}"
                              </span>
                            </blockquote>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Carousel Navigation */}
              <CarouselPrevious className="-left-12 hidden sm:flex" />
              <CarouselNext className="-right-12 hidden sm:flex" />
            </Carousel>
          </motion.div>

          {/* View All Reviews Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-8 sm:mt-12 lg:mt-16"
          >
            <Button variant="outline" size="lg" className="group" asChild>
              <a
                href="https://maps.app.goo.gl/Q2v1FDMw5LJHBBCA9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <span>{t("view_all")}</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-all duration-300" />
              </a>
            </Button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
