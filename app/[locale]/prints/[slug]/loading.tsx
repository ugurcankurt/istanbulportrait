import { Skeleton } from "@/components/ui/skeleton";

export default function PrintDetailsLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center space-x-2 mb-8">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery Skeleton */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="space-y-6">
          <div>
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 sm:h-12 w-3/4 mb-4" />
            <Skeleton className="h-10 w-32 mb-6" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* What to Expect Skeleton */}
          <div className="space-y-4 pt-4">
            <Skeleton className="h-8 w-48 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-6 w-full max-w-md" />
              </div>
            ))}
          </div>

          {/* Configurator Skeleton */}
          <div className="pt-8 space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center p-2 space-y-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
