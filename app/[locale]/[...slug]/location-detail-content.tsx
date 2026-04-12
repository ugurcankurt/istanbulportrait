import {
  Camera,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LocationCard } from "@/components/location-card";
import { Link } from "@/i18n/routing";
import { locationsService } from "@/lib/locations-service";


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

  const t = await getTranslations({ locale, namespace: "locations" });
  const baseUrl = "https://istanbulphotosession.com.tr";

  const dynamicTitle = location.title?.[locale] || location.title?.en || slug;
  const dynamicDesc = location.description?.[locale] || location.description?.en || "";
  const dynamicBestTime = location.best_time?.[locale] || location.best_time?.en || "";
  const photographyTips = location.photography_tips?.[locale] || location.photography_tips?.en || [];

  const heroImage = location.cover_image
    ? (location.cover_image.startsWith("http") ? location.cover_image : `${baseUrl}${location.cover_image}`)
    : `${baseUrl}/images/locations/${slug}-hero.webp`;
  const galleryImages = location.gallery_images || [];



  return (
    <div className="min-h-screen">


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
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

          {/* Hero Content - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 pb-6 sm:pb-8 lg:pb-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
                {dynamicTitle}
              </h1>
              <p className="text-sm sm:text-lg lg:text-xl text-white/90 max-w-3xl leading-relaxed drop-shadow-md line-clamp-3">
                {dynamicDesc}
              </p>

              {/* Quick Info Bar */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 sm:mt-6">
                <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
                  <MapPin className="w-4 h-4" />
                  <span>{location.coordinates ? `${location.coordinates.lat.toFixed(4)}, ${location.coordinates.lng.toFixed(4)}` : t("locationInfo")}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
                  <Camera className="w-4 h-4" />
                  <span>
                    {photographyTips.length} {t("photographyTips")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

              {/* Nearby Locations via tag match */}
              {location.nearby_locations && location.nearby_locations.length > 0 && (
                <div className="space-y-6 pt-4 border-t">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    <span className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
                    {t("nearbyLocations", { default: "Nearby Locations" })}
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {allLocations
                      .filter(l => location.nearby_locations.includes(l.slug) && l.id !== location.id)
                      .slice(0, 4)
                      .map((nearbyLoc, idx) => (
                        <div key={nearbyLoc.slug} className="pointer-events-auto h-[250px] sm:h-[300px]">
                          <LocationCard location={nearbyLoc} index={idx} parentSlug={parentSlug} />
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

              {/* CTA Card - Book Photoshoot */}
              <Card className="overflow-hidden bg-primary text-primary-foreground border-0 shadow-xl py-0 gap-0">
                <CardContent className="p-5 sm:p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-2 text-primary-foreground">
                    {t("bookPhotoshoot")}
                  </h3>
                  <p className="text-primary-foreground/80 text-sm mb-5 leading-relaxed">
                    {t("bookPhotoshootDescription")}
                  </p>
                  <Button
                    render={<Link href={"/packages" as any} />}
                    variant="secondary"
                    className="w-full font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {t("viewPackages")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
