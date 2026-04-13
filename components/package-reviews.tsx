import { CheckCircle, Info, Quote, Star, ThumbsUp, X, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AggregateRating, GoogleReview } from "@/types/reviews";

interface PackageReviewsProps {
  reviews: GoogleReview[];
  aggregateRating: AggregateRating;
}

export function PackageReviews({ reviews, aggregateRating }: PackageReviewsProps) {
  const t = useTranslations("reviews");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const renderStars = (rating: number, size: "xs" | "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      xs: "w-2.5 h-2.5",
      sm: "w-3.5 h-3.5",
      md: "w-4.5 h-4.5",
      lg: "w-8 h-8",
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              star <= rating
                ? "fill-foreground text-foreground"
                : "fill-muted text-muted"
            )}
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
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const filteredReviews = useMemo(() => {
    if (!filterRating) return reviews;
    return reviews.filter(review => review.rating === filterRating);
  }, [reviews, filterRating]);

  const handleHelpfulClick = () => {
    window.open("https://maps.app.goo.gl/Q2v1FDMw5LJHBBCA9", "_blank");
  };

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  return (
    <section id="reviews" className="py-12 sm:py-16 border-t border-slate-300 scroll-mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">

        {/* LEFT SIDEBAR - Overall Rating & Summary */}
        <div className="lg:col-span-1 space-y-10 lg:sticky lg:top-44 h-fit">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-foreground">{t("overall_rating")}</h3>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-extrabold text-primary">{Number(aggregateRating.average || 0).toFixed(1)}</div>
              <div className="text-xl font-bold text-muted-foreground">/ 5</div>
            </div>
            {renderStars(Math.round(aggregateRating.average || 5), "lg")}
            <p className="text-sm font-medium text-muted-foreground">
              {t("based_on", { count: aggregateRating.count })}
            </p>
          </div>

          <div className="space-y-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-tight">{t("summary")}</h4>
              {filterRating && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setFilterRating(null)}
                  className="h-auto p-0 text-[10px] font-bold text-primary flex items-center gap-1"
                >
                  <X className="w-2.5 h-2.5" />
                  {t("clear_filter")}
                </Button>
              )}
            </div>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = aggregateRating.distribution[stars as keyof typeof aggregateRating.distribution] || 0;
                const percentage = aggregateRating.count > 0 ? (count / aggregateRating.count) * 100 : 0;

                return (
                  <button
                    key={stars}
                    onClick={() => {
                      setFilterRating(filterRating === stars ? null : stars);
                      setVisibleCount(10);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 group transition-opacity",
                      filterRating && filterRating !== stars ? "opacity-30" : "opacity-100"
                    )}
                  >
                    <span className="w-20 text-xs font-bold text-muted-foreground text-start group-hover:text-foreground transition-colors">
                      {stars === 5 ? t("excellent") : stars === 4 ? t("very_good") : stars === 3 ? t("average") : stars === 2 ? t("poor") : t("terrible")}
                    </span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          filterRating === stars ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-end text-xs font-bold text-foreground">
                      {stars}.0/5
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground leading-tight">
              {t("filter_hint")}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - Review List */}
        <div className="lg:col-span-3 space-y-10">
          {/* Marketplace Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>
                {filterRating
                  ? t("filter_stars", { count: filterRating })
                  : t("verified_visitors")}
              </span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="divide-y divide-border min-h-[400px]">
            {filteredReviews.length > 0 ? (
              <>
                {filteredReviews.slice(0, visibleCount).map((review, index) => (
                  <div
                    key={review.id || index}
                    className="py-10 first:pt-0 last:pb-0 group animate-in fade-in slide-in-from-bottom-2 duration-500"
                  >
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating, "sm")}
                          <span className="text-sm font-bold text-foreground">{review.rating}</span>
                        </div>
                        {(!review.text || review.text === "") && (
                          <div className="px-2 py-1 bg-muted rounded text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {t("rating_only")}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-foreground text-lg font-bold border border-border/50">
                          {review.author.photoUrl ? (
                            <Image
                              src={review.author.photoUrl}
                              alt={review.author.name}
                              width={44}
                              height={44}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            review.author.name.charAt(0)
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold text-foreground flex items-center gap-2">
                            {review.author.name}
                            <span title="Verified Customer">
                              <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground font-medium tracking-wide">
                            {formatDate(review.date)}
                          </div>
                        </div>
                      </div>

                      {review.text && review.text.trim() !== "" ? (
                        <div className="relative">
                          <blockquote className="text-base font-semibold leading-relaxed text-foreground/90">
                            {review.text}
                          </blockquote>
                        </div>
                      ) : (
                        <div className="text-sm italic text-muted-foreground font-medium py-3 px-4 bg-muted/50 rounded-xl border-s-4 border-border/50">
                          {t("rating_no_text")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {visibleCount < filteredReviews.length && (
                  <div className="pt-12 text-center">
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleShowMore}
                      className="font-bold flex items-center gap-2 mx-auto"
                    >
                      {t("show_more")}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 text-muted-foreground/50">
                  <Star className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-foreground">{t("no_reviews")}</p>
                  <p className="text-sm text-muted-foreground">{t("show_all")}</p>
                  <Button
                    variant="default"
                    onClick={() => setFilterRating(null)}
                    className="mt-4 px-6 font-bold"
                  >
                    {t("show_all")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
