"use client";

import { Suspense } from "react";
import { ToursPageContent } from "@/app/[locale]/tours/tours-content";
import { TourCardSkeleton } from "@/components/tour-card";

interface ToursContentSectionProps {
  locale: string;
}

export function ToursContentSection({ locale }: ToursContentSectionProps) {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Suspense
            fallback={
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <TourCardSkeleton key={index} />
                ))}
              </div>
            }
          >
            <ToursPageContent locale={locale} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
