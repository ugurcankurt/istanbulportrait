// Note: Static TourCard component removed - using GetYourGuide widgets only

import { Card, CardContent, CardFooter } from "@/components/ui/card";

// Loading skeleton component
export function TourCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Card className="h-full overflow-hidden border-0 bg-card shadow-lg p-0">
        {/* Image Section - Direct inside Card */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted animate-pulse rounded-t-lg" />

        <CardContent className="flex-1 px-4 pt-4 pb-2">
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-4 bg-muted rounded w-16 animate-pulse" />
              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
              <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-1">
          <div className="flex w-full items-end justify-between">
            <div className="space-y-1">
              <div className="h-3 bg-muted rounded w-16 animate-pulse" />
              <div className="h-7 bg-muted rounded w-24 animate-pulse" />
            </div>
            <div className="h-9 bg-muted rounded w-24 animate-pulse" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
