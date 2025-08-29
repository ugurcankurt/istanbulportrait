import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { CheckoutForm } from "@/components/checkout-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });

  return {
    title: `${t("title")} | Istanbul Photographer`,
    description: t("description"),
  };
}

function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 max-w-6xl">
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
