// Note: Static TourCard component removed - using GetYourGuide widgets only

import { Card, CardContent, CardFooter } from "@/components/ui/card";

// Loading skeleton component
export function TourCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Card className="h-full overflow-hidden border-0 bg-white shadow-lg dark:bg-gray-900 p-0">
        {/* Image Section - Direct inside Card */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse rounded-t-lg" />

        <CardContent className="flex-1 px-4 pt-4 pb-2">
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 dark:bg-gray-700 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-4 bg-gray-200 rounded w-16 dark:bg-gray-700 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-20 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-1/2 dark:bg-gray-700 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-2/3 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 pb-4 pt-1">
          <div className="flex w-full items-end justify-between">
            <div className="space-y-1">
              <div className="h-3 bg-gray-200 rounded w-16 dark:bg-gray-700 animate-pulse" />
              <div className="h-7 bg-gray-200 rounded w-24 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="h-9 bg-gray-200 rounded w-24 dark:bg-gray-700 animate-pulse" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
