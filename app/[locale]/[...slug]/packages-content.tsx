import dynamic from "next/dynamic";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PageHeroSection } from "@/components/page-hero-section";
const PackagesSection = dynamic(() =>
  import("@/components/packages-section").then((mod) => mod.PackagesSection),
);

import { reviewsService } from "@/lib/reviews-service";
import { packagesService, type PackageDB } from "@/lib/packages-service";

import { pagesContentService } from "@/lib/pages-content-service";
import { discountService } from "@/lib/discount-service";
import { SchemaInjector } from "@/components/schema-injector";
import { buildCollectionPageSchema, generateSeoDescription, getBaseUrl } from "@/lib/seo-utils";
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

  // Fetch active discount
  const activeDiscount = await discountService.getActiveDiscount();

  const collectionSchema = buildCollectionPageSchema({
    name: dynamicTitle,
    description: generateSeoDescription(dynamicSubtitle),
    url: `${getBaseUrl()}/${locale}/${parentSlug}`,
    items: dbPackages.map(pkg => ({
      name: pkg.title?.[locale] || pkg.title?.en || pkg.slug,
      description: pkg.description?.[locale] || pkg.description?.en ? generateSeoDescription(pkg.description?.[locale] || pkg.description?.en || "") : undefined,
      url: `${getBaseUrl()}/${locale}/${parentSlug}/${pkg.slug}`,
      image: pkg.gallery_images?.[0]
    }))
  });

  return (
    <div>
      <SchemaInjector schema={collectionSchema} />
      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />
      <div className="section-contain-auto">
        {/* Pass the purely dynamic packages object to Section along with parentSlug */}
        <PackagesSection aggregateRating={aggregateRating} dbPackages={dbPackages} parentSlug={parentSlug} activeDiscount={activeDiscount} />
      </div>
    </div>
  );
}
