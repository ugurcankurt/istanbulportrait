import { Skeleton } from "@/components/ui/skeleton";

export default function PrintsLoading() {
  return (
    <div className="bg-gradient-to-b from-background to-muted/20 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center space-x-2 mb-8">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Hero Section Skeleton */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="flex justify-center mb-4">
            <Skeleton className="h-8 w-40 rounded-full" />
          </div>
          <Skeleton className="h-10 sm:h-12 w-64 sm:w-80 mx-auto mb-6" />
          <Skeleton className="h-4 sm:h-6 w-full max-w-2xl mx-auto mb-2" />
          <Skeleton className="h-4 sm:h-6 w-3/4 max-w-xl mx-auto mb-8" />

          {/* Category Filter Skeleton */}
          <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-xl border border-muted overflow-hidden bg-background">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3">
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
