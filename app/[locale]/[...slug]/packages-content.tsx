import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PageHeroSection } from "@/components/page-hero-section";
const PackagesSection = dynamic(() =>
  import("@/components/packages-section").then((mod) => mod.PackagesSection),
);
import { getDynamicCoreLocalizedPaths, getOpenGraphUrl } from "@/lib/localized-url";
import { settingsService } from "@/lib/settings-service";
import { reviewsService } from "@/lib/reviews-service";
import { packagesService, type PackageDB } from "@/lib/packages-service";

import { pagesContentService } from "@/lib/pages-content-service";



export async function PackagesPageContent({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: parentSlug } = await params;

  const dbPage = await pagesContentService.getPageBySlug("packages");
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "";
  const dynamicSubtitle = dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";

  // Fetch real reviews aggregate rating
  const aggregateRating = await reviewsService.getAggregateRating();
  
  // Fetch fully dynamic packages from DB
  const dbPackages = await packagesService.getActivePackages();



  return (
    <div>


      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />
      <div className="section-contain-auto">
        {/* Pass the purely dynamic packages object to Section along with parentSlug */}
        <PackagesSection aggregateRating={aggregateRating} dbPackages={dbPackages} parentSlug={parentSlug} />
      </div>
    </div>
  );
}
