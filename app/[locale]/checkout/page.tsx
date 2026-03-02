import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { CheckoutForm } from "@/components/checkout-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout.seo" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/checkout", baseUrl);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 max-w-6xl">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
          <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-9 sm:h-10 w-full" />
              <Skeleton className="h-9 sm:h-10 w-full" />
              <Skeleton className="h-9 sm:h-10 w-full" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-24 sm:h-32 w-full" />
              <Skeleton className="h-12 sm:h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <BreadcrumbNav />
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
