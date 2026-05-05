"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { ResumeViewingCard, type LastVisited } from "@/components/resume-viewing-card";
import type { DiscountDB } from "@/lib/discount-service";

interface HeroClientWrapperProps {
  packagesButtonText: string;
  checkLocationsButtonText: string;
  children: React.ReactNode;
  activeDiscount?: DiscountDB | null;
}

export function HeroClientWrapper({
  packagesButtonText,
  checkLocationsButtonText,
  children,
  activeDiscount,
}: HeroClientWrapperProps) {
  const [visitedPackages, setVisitedPackages] = useState<LastVisited[]>([]);
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("visited_packages");
    if (stored) {
      try {
        const data: LastVisited[] = JSON.parse(stored);
        const now = Date.now();
        const thirtySixHours = 36 * 60 * 60 * 1000;
        const validPackages = data.filter((p) => now - p.timestamp < thirtySixHours);

        if (validPackages.length > 0) {
          setVisitedPackages(validPackages);
          setHasVisited(true);
        }
      } catch (e) {
        console.error("Error parsing visited_packages", e);
      }
    }
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col items-start w-full",
        hasVisited && "lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center"
      )}
    >
      <div className={cn("max-w-2xl w-full", !hasVisited && "lg:max-w-3xl")}>
        {children}

        {/* CTA Buttons - Client side tracking and layout adjustment */}
        <div className="flex flex-row flex-wrap justify-start items-center gap-4 w-full mb-8">
          <Button nativeButton={false}
            render={
              <Link href={"/packages" as any} className="flex items-center justify-center gap-2">
                {packagesButtonText}
                <ArrowRight className="w-4 h-4" />
              </Link>
            }
            size="lg"
            className="w-auto min-w-[160px] h-14 px-8 rounded-full font-bold text-base shadow-lg hover:scale-105 transition-transform bg-white text-slate-900 border-none hover:bg-slate-100"
            onClick={() => trackEvent("cta_click", "Hero", "View Packages")}
          />

          <Button nativeButton={false}
            render={<Link href={"/locations" as any}>{checkLocationsButtonText}</Link>}
            variant="outline"
            size="lg"
            className="w-auto min-w-[160px] h-14 px-8 rounded-full border-[0.5px] border-white/40 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-semibold transition-all hover:scale-105"
            onClick={() => trackEvent("cta_click", "Hero", "Check Locations")}
          />
        </div>
      </div>

      {hasVisited && (
        <div className="w-full mt-4 lg:mt-0">
          <ResumeViewingCard
            visitedPackages={visitedPackages}
            showTitle={true}
            withContainer={false}
            isMainTitle={false}
            activeDiscount={activeDiscount}
          />
        </div>
      )}
    </div>
  );
}
