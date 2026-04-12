
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LocationCard } from "@/components/location-card";
import { PageHeroSection } from "@/components/page-hero-section";
import { locationsService } from "@/lib/locations-service";

import { pagesContentService } from "@/lib/pages-content-service";



export async function LocationsPageContent({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const { locale, slug: parentSlug } = params;
  const dbPage = await pagesContentService.getPageBySlug("locations");
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "";
  const dynamicSubtitle = dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";

  const dbLocations = await locationsService.getLocations();

  return (
    <div>


      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />

      {/* Locations Grid */}
      <section className="py-8 sm:py-10 section-contain-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {dbLocations.map((location, index) => (
              <LocationCard
                key={location.slug}
                location={location}
                index={index}
                parentSlug={parentSlug}
              />
            ))}
          </div>


        </div>
      </section>
    </div>
  );
}
