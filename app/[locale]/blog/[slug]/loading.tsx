import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function BlogPostLoading() {
  return (
    <div className="min-h-screen">
      {/* Breadcrumb Skeleton */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <article className="mx-auto">
          {/* Header Skeleton */}
          <header className="mb-8">
            <AspectRatio ratio={16 / 9} className="mb-8 rounded-lg overflow-hidden">
              <Skeleton className="h-full w-full" />
            </AspectRatio>

            <Skeleton className="h-10 md:h-12 w-3/4 mb-4" />
            
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
            </div>
          </header>

          {/* AI Summary Skeleton */}
          <div className="mb-10 p-6 rounded-2xl bg-muted/30 border border-border">
             <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-32" />
             </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
             </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-4 mb-12">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={`h-4 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-[95%]' : 'w-[92%]'}`} 
              />
            ))}
          </div>

          {/* Author Bio Skeleton */}
          <div className="flex items-center gap-4 p-6 rounded-xl border border-border bg-muted/5">
            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
