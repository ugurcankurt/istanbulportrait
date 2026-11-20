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
    <div
      data-nosnippet
      className="w-full bg-red-700/95 christmas:bg-gradient-to-r christmas:from-[#641220] christmas:via-[#800f2f] christmas:to-[#133a2a] backdrop-blur-md text-white text-xs sm:text-sm font-semibold tracking-wider uppercase overflow-hidden flex whitespace-nowrap py-2 relative z-50 border-b border-white/10 christmas:border-[#d4af37]/35 shadow-sm"
    >
      <div className="flex animate-marquee w-max">
        {/* Duplicate marquee items (4x = 2 halves) for seamless -50% CSS loop with minimal DOM */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            {discounts.map((d) => (
              <span
                key={`${i}-${d.id}`}
                className="flex items-center mx-8 drop-shadow-sm uppercase tracking-wide"
              >
                <TicketPercent className="w-4 h-4 mr-2 opacity-80 christmas:text-[#f3d37a] christmas:opacity-100" />
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
