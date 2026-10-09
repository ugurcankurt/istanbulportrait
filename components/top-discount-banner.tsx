"use client";

import { TicketPercent } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DiscountDB } from "@/lib/discount-service";

export function TopDiscountBanner({
  discounts,
}: {
  discounts: DiscountDB[] | null;
}) {
  const t = useTranslations("ui");

  if (!discounts || discounts.length === 0) return null;

  return (
    <div className="w-full bg-red-600 text-white text-xs sm:text-sm font-bold overflow-hidden flex whitespace-nowrap py-1.5 relative z-50 border-b border-black/10 shadow-sm">
      <div className="flex animate-marquee w-max">
        {/* We duplicate the content to create an infinite scroll effect */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center">
            {discounts.map((d) => (
              <span
                key={`${i}-${d.id}`}
                className="flex items-center mx-8 drop-shadow-sm uppercase tracking-wide"
              >
                <TicketPercent className="w-4 h-4 mr-2 opacity-80" />
                {t("newsletter_badge")}: {d.name} / -
                {Math.round(d.discount_percentage * 100)}%
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
