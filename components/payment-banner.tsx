"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { GoogleReview } from "@/types/reviews";

export function PaymentBanner() {
    const t = useTranslations("payment_banner");
    const [reviews, setReviews] = useState<GoogleReview[]>([]);

    useEffect(() => {
        // Fetch reviews on client side
        fetch("/api/reviews")
            .then((res) => res.json())
            .then((data) => {
                if (data.reviews && data.reviews.length > 0) {
                    setReviews(data.reviews);
                }
            })
            .catch((error) => {
                console.error("Error fetching reviews:", error);
            });
    }, []);

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-3 h-3 ${star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted text-muted"
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="bg-primary/5 border-b border-primary/10 overflow-hidden">
            <div className="w-full">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 py-1.5 px-4 sm:px-6 lg:px-8">
                    {/* Left: Scrolling Reviews */}
                    <div className="flex-1 w-full overflow-hidden">
                        {reviews.length > 0 ? (
                            <div className="relative flex">
                                {/* First set of reviews */}
                                <div className="animate-marquee flex gap-6 md:gap-8 whitespace-nowrap shrink-0">
                                    {reviews.map((review, index) => (
                                        <div
                                            key={`set1-${review.id}-${index}`}
                                            className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                                        >
                                            {renderStars(review.rating)}
                                            <span className="font-semibold text-foreground">
                                                {review.author.name}
                                            </span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="italic">"{review.text}"</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Second set of reviews (duplicate for seamless loop) */}
                                <div className="animate-marquee flex gap-6 md:gap-8 whitespace-nowrap shrink-0">
                                    {reviews.map((review, index) => (
                                        <div
                                            key={`set2-${review.id}-${index}`}
                                            className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                                        >
                                            {renderStars(review.rating)}
                                            <span className="font-semibold text-foreground">
                                                {review.author.name}
                                            </span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="italic">"{review.text}"</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-xs sm:text-sm text-muted-foreground">
                                <span className="hidden sm:inline">🔒</span> {t("message")}
                            </div>
                        )}
                    </div>

                    {/* Right: Payment Info */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <span className="hidden md:inline text-xs sm:text-sm text-muted-foreground">
                            🔒 {t("message")}
                        </span>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <a
                                href="https://www.iyzico.com/en/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-opacity hover:opacity-100"
                            >
                                <Image
                                    src="/pay_with_iyzico_colored.svg"
                                    alt="Iyzico"
                                    width={50}
                                    height={5}
                                    className="object-contain opacity-70 hover:opacity-100 transition-opacity w-[50px] sm:w-[50px]"
                                />
                            </a>
                            <a
                                href="https://turinvoice.ru/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-opacity hover:opacity-100"
                            >
                                <Image
                                    src="/turinvoice_logo.png"
                                    alt="Turinvoice"
                                    width={50}
                                    height={5}
                                    className="object-contain opacity-70 hover:opacity-100 transition-opacity w-[50px] sm:w-[50px]"
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 80s linear infinite;
        }

        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
}
