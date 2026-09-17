import { Camera, Clock, ExternalLink, MapPin, Sparkles } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LocationCard } from "@/components/location-card";
import { SchemaInjector } from "@/components/schema-injector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { locationsService } from "@/lib/locations-service";
import { packagesService } from "@/lib/packages-service";
import { discountService } from "@/lib/discount-service";
import { reviewsService } from "@/lib/reviews-service";

import { PackagesSection } from "@/components/packages-section";
import { PackageReviews } from "@/components/package-reviews";
import {
  buildTouristAttractionSchema,
  generateSeoDescription,
} from "@/lib/seo-utils";
import { generateNativeSlug } from "@/lib/slug-generator";

// Force dynamic rendering to avoid Vercel build-time issues with next-intl
export const dynamic = "force-dynamic";

export async function LocationDetailPageContent({
  slug,
  parentSlug,
  locale,
}: {
  slug: string;
  parentSlug: string;
  locale: string;
}) {
  const location = await locationsService.getLocationBySlug(slug);
  const allLocations = await locationsService.getLocations();

  if (!location) {
    notFound();
  }

  // Fetch data for Hub & Spoke model
  const activePackages = await packagesService.getActivePackages();
  const activeDiscount = await discountService.getActiveDiscount();
  const aggregateRating = await reviewsService.getAggregateRating();
  const { reviews } = await reviewsService.fetchGoogleReviews(locale);

  const t = await getTranslations({ locale, namespace: "locations" });
  const tPackages = await getTranslations({ locale, namespace: "packages" });
  const { getBaseUrl } = await import("@/lib/seo-utils");
  const baseUrl = getBaseUrl();

  const dynamicTitle = location.title?.[locale] || location.title?.en || slug;
  const dynamicDesc =
    location.description?.[locale] || location.description?.en || "";
  const dynamicBestTime =
    location.best_time?.[locale] || location.best_time?.en || "";
  const photographyTips =
    location.photography_tips?.[locale] || location.photography_tips?.en || [];

  const heroImage = location.cover_image
    ? location.cover_image.startsWith("http")
      ? location.cover_image
      : `${baseUrl}${location.cover_image}`
    : `${baseUrl}/images/locations/${slug}-hero.webp`;
  const galleryImages = location.gallery_images || [];

  // Generate ItemList Schema for the packages (GYG style)
  const itemListElements = activePackages.map((pkg, index) => {
    const pkgTitle = pkg.title?.[locale] || pkg.title?.en || pkg.slug;
    const pkgSlug = pkg.title?.[locale] ? generateNativeSlug(pkg.title[locale]) || pkg.slug : pkg.slug;
    const locSlug = location.title?.[locale] ? generateNativeSlug(location.title[locale]) || location.slug : location.slug;

    return {
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Service",
        "name": `${pkgTitle} - ${dynamicTitle}`,
        "url": `${baseUrl}/${locale}/photoshoot/${locSlug}/${pkgSlug}`
      }
    };
  });

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": itemListElements,
  };

  const touristAttractionSchema = buildTouristAttractionSchema({
    name: dynamicTitle,
    description: generateSeoDescription(dynamicDesc),
    image: heroImage,
    lat: location.coordinates?.lat,
    lng: location.coordinates?.lng,
    url: `${baseUrl}/${locale}/locations/${slug}`,
  });

  return (
    <div className="min-h-screen bg-background">
      <SchemaInjector schema={touristAttractionSchema} />
      <SchemaInjector schema={itemListSchema} />

      <BreadcrumbNav />

      {/* Hero Section - Enhanced */}
      <section className="relative">
        <div className="relative h-[50vh] sm:h-[55vh] lg:h-[65vh] overflow-hidden">
          <Image
            src={heroImage}
            alt={dynamicTitle}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          <div className="absolute bottom-0 left-0 right-0 pb-6 sm:pb-8 lg:pb-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
                {dynamicTitle}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-white/90 max-w-3xl leading-relaxed drop-shadow-md line-clamp-3 mb-4">
                {dynamicDesc}
              </p>

              {/* GYG Style Trust Badges */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-white font-medium text-sm">
                    {aggregateRating.average} ({aggregateRating.count} {tPackages("reviews")})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-white/90 text-sm bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                  <Camera className="w-4 h-4" />
                  <span>{activePackages.length} {t("photoshoot_options", { default: "Photoshoot Options" })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GYG Hub & Spoke Packages Section */}
      <div className="bg-muted/10 border-b">
        <PackagesSection
          dbPackages={activePackages}
          activeDiscount={activeDiscount}
          aggregateRating={aggregateRating}
          parentSlug={`photoshoot/${location.title?.[locale] ? generateNativeSlug(location.title[locale]) || location.slug : location.slug}`}
          header={
            <div key="explore-packages-header" className="mb-6 sm:mb-8 pt-4">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
                {t("explore_packages", { default: `Photoshoots at ${dynamicTitle}` })}
              </h2>
              <p className="text-muted-foreground">
                {t("explore_packages_desc", { default: "Select a package to view details and book your session." })}
              </p>
            </div>
          }
        />
      </div>

      {/* Content Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Main Content - Left/Center */}
            <div className="lg:col-span-2 space-y-8 sm:space-y-10">

              {/* About Section */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                  <span className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
                  {t("aboutLocation")}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed whitespace-pre-line">
                  {dynamicDesc}
                </p>
              </div>

              {/* Photography Tips Section */}
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                  <span className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
                  {t("photographyTips")}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {photographyTips.map((tip, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 py-0 gap-0"
                    >
                      <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1 sm:pt-2">
                            {tip}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Gallery Section */}
              {galleryImages.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    <span className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
                    {t("gallery")}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {galleryImages.map((img, index) => (
                      <div
                        key={index}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                      >
                        <Image
                          src={img}
                          alt={`${dynamicTitle} photo ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby Locations */}
              {location.nearby_locations &&
                location.nearby_locations.length > 0 && (
                  <div className="space-y-6 pt-4 border-t">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                      <span className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
                      {t("nearbyLocations", { default: "Nearby Locations" })}
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {allLocations
                        .filter(
                          (l) =>
                            location.nearby_locations.includes(l.slug) &&
                            l.id !== location.id,
                        )
                        .slice(0, 4)
                        .map((nearbyLoc, idx) => (
                          <div
                            key={nearbyLoc.slug}
                            className="pointer-events-auto h-[250px] sm:h-[300px]"
                          >
                            <LocationCard
                              location={nearbyLoc}
                              index={idx}
                              parentSlug={parentSlug}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Sidebar - Right */}
            <div className="space-y-4 sm:space-y-5 lg:sticky lg:top-24 lg:self-start">
              {/* Best Time Card */}
              <Card className="overflow-hidden py-0 gap-0 border-primary/20">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg">
                      {t("bestTimeToVisit")}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-sm">
                      {dynamicBestTime}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Location Info Card */}
              <Card className="overflow-hidden py-0 gap-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg">
                      {t("locationInfo")}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {dynamicTitle}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${location.coordinates?.lat || 41.0082},${location.coordinates?.lng || 28.9784}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                  >
                    {t("viewOnMap")}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof (Reviews) Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 border-t py-8 sm:py-12">
        <PackageReviews reviews={reviews} aggregateRating={aggregateRating} />
      </div>
    </div>
  );
}
