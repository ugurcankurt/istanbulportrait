import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocalizedPaths } from "@/lib/localized-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();

  const baseUrl = settings.app_base_url || "https://istanbulportrait.com";
  const paths = getLocalizedPaths("/checkout", baseUrl);

  return {
    title: "Secure Checkout | Istanbul Portrait",
    description: "Secure checkout page for your Istanbul photography booking.",
    alternates: {
      canonical: paths.canonical(locale),
      languages: paths.languages,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

function CheckoutSkeleton() {
  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Mini header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      {/* Step indicator skeleton */}
      <div className="flex items-center justify-center gap-4 py-4 px-6 border-b">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-0.5 flex-1" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-0.5 flex-1" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      {/* Content skeleton */}
      <div className="flex-1 px-4 py-4 space-y-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
      {/* Button skeleton */}
      <div className="px-4 py-4 border-t">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutForm />
    </Suspense>
  );
}