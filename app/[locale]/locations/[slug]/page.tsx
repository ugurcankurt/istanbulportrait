import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import {
    getAllLocationSlugs,
    getLocationBySlug,
    LOCATIONS,
} from "@/lib/locations/location-data";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
    createSchemaConfig,
    generateBreadcrumbListSchema,
    type BreadcrumbData,
    MultipleJsonLd,
} from "@/lib/structured-data";
import { Camera, Clock, MapPin, Star, ExternalLink, Sparkles } from "lucide-react";

// Force dynamic rendering to avoid Vercel build-time issues with next-intl
export const dynamic = "force-dynamic";

// Allow on-demand generation for paths not in generateStaticParams
export const dynamicParams = true;

// Generate static params for all locations
export async function generateStaticParams() {
    try {
        const slugs = getAllLocationSlugs();
        return slugs.map((slug) => ({ slug }));
    } catch (error) {
        console.error("Failed to generate location slugs:", error);
        return [];
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string; locale: string }>;
}) {
    const { slug, locale } = await params;
    const location = getLocationBySlug(slug);

    if (!location) {
        return { title: "Location Not Found" };
    }

    const t = await getTranslations({ locale, namespace: "locations" });
    const baseUrl = SEO_CONFIG.site.url;

    return {
        title: t(`items.${slug}.seoTitle`),
        description: t(`items.${slug}.seoDescription`),
        alternates: {
            canonical: `${baseUrl}/${locale}/locations/${slug}`,
        },
        openGraph: {
            title: t(`items.${slug}.seoTitle`),
            description: t(`items.${slug}.seoDescription`),
            url: `${baseUrl}/${locale}/locations/${slug}`,
            siteName: SEO_CONFIG.organization.name,
            images: [
                {
                    url: `${baseUrl}${location.images.hero}`,
                    width: 1200,
                    height: 630,
                    alt: t(`items.${slug}.name`),
                },
            ],
            locale: locale,
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: t(`items.${slug}.seoTitle`),
            description: t(`items.${slug}.seoDescription`),
            images: [`${baseUrl}${location.images.hero}`],
        },
    };
}

export default async function LocationDetailPage({
    params,
}: {
    params: Promise<{ slug: string; locale: string }>;
}) {
    const { slug, locale } = await params;
    const location = getLocationBySlug(slug);

    if (!location) {
        notFound();
    }

    const t = await getTranslations({ locale, namespace: "locations" });
    const schemaConfig = createSchemaConfig(locale);

    // Generate TouristAttraction schema (better than Place for photography locations)
    const touristAttractionSchema = {
        "@context": "https://schema.org" as const,
        "@type": "TouristAttraction" as const,
        "@id": `${schemaConfig.baseUrl}/${locale}/locations/${slug}#attraction`,
        name: t(`items.${slug}.name`),
        description: t(`items.${slug}.description`),
        geo: {
            "@type": "GeoCoordinates" as const,
            latitude: location.coordinates.lat,
            longitude: location.coordinates.lng,
        },
        address: {
            "@type": "PostalAddress" as const,
            addressLocality: "Istanbul",
            addressCountry: "TR",
        },
        image: `${schemaConfig.baseUrl}${location.images.hero}`,
        photo: location.images.gallery.map((img) => ({
            "@type": "ImageObject" as const,
            url: `${schemaConfig.baseUrl}${img}`,
        })),
        containedInPlace: {
            "@type": "City" as const,
            name: "Istanbul",
            sameAs: "https://www.wikidata.org/wiki/Q406",
        },
        sameAs: `https://www.wikidata.org/wiki/${location.wikidataId}`,
    };

    // Generate Breadcrumb schema
    const breadcrumbData: BreadcrumbData[] = [
        { name: "Home", url: `${schemaConfig.baseUrl}/${locale}`, position: 1 },
        {
            name: t("title"),
            url: `${schemaConfig.baseUrl}/${locale}/locations`,
            position: 2,
        },
        {
            name: t(`items.${slug}.name`),
            url: `${schemaConfig.baseUrl}/${locale}/locations/${slug}`,
            position: 3,
        },
    ];
    const breadcrumbSchema = generateBreadcrumbListSchema(
        breadcrumbData,
        schemaConfig
    );

    return (
        <div className="min-h-screen">
            {/* JSON-LD Structured Data */}
            <MultipleJsonLd schemas={[touristAttractionSchema, breadcrumbSchema]} />

            <BreadcrumbNav />

            {/* Hero Section - Enhanced */}
            <section className="relative">
                <div className="relative h-[50vh] sm:h-[55vh] lg:h-[65vh] overflow-hidden">
                    <Image
                        src={location.images.hero}
                        alt={t(`items.${slug}.name`)}
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
                                {t(`items.${slug}.name`)}
                            </h1>
                            <p className="text-sm sm:text-lg lg:text-xl text-white/90 max-w-3xl leading-relaxed drop-shadow-md">
                                {t(`items.${slug}.shortDescription`)}
                            </p>

                            {/* Quick Info Bar */}
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 sm:mt-6">
                                <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
                                    <MapPin className="w-4 h-4" />
                                    <span>Istanbul, Turkey</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm sm:text-base">
                                    <Camera className="w-4 h-4" />
                                    <span>{location.photographyTips.length} {t("photographyTips")}</span>
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
                                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
                                    {t(`items.${slug}.description`)}
                                </p>
                            </div>

                            {/* Photography Tips Section */}
                            <div className="space-y-4">
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                                    <span className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
                                    {t("photographyTips")}
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                                    {location.photographyTips.map((tip, index) => (
                                        <Card key={tip} className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 py-0 gap-0">
                                            <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-sm sm:text-base mb-1">
                                                        {t(`tips.${tip}.title`)}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                        {t(`tips.${tip}.description`)}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Gallery Section */}
                            {location.images.gallery.length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                                        <span className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
                                        {t("gallery")}
                                    </h2>
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        {location.images.gallery.map((img, index) => (
                                            <div
                                                key={index}
                                                className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow"
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`${t(`items.${slug}.name`)} photo ${index + 1}`}
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

                            {/* Nearby Locations Section */}
                            {location.nearbyLocations.length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                                        <span className="w-1 h-6 sm:h-8 bg-primary rounded-full" />
                                        {t("nearbyLocations")}
                                    </h2>
                                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                                        {location.nearbyLocations
                                            .map(slug => LOCATIONS.find(loc => loc.slug === slug))
                                            .filter((loc): loc is NonNullable<typeof loc> => loc !== undefined)
                                            .map((nearbyLocation) => (
                                                <Link
                                                    key={nearbyLocation.slug}
                                                    href={{
                                                        pathname: "/locations/[slug]" as const,
                                                        params: { slug: nearbyLocation.slug },
                                                    }}
                                                    className="group"
                                                >
                                                    <Card className="overflow-hidden py-0 gap-0 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                                                        <div className="flex items-center gap-3 p-3 sm:p-4">
                                                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                                <Image
                                                                    src={nearbyLocation.images.hero}
                                                                    alt={t(`items.${nearbyLocation.slug}.name`)}
                                                                    fill
                                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                                    sizes="80px"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
                                                                    {t(`items.${nearbyLocation.slug}.name`)}
                                                                </h3>
                                                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                                                    {t(`items.${nearbyLocation.slug}.shortDescription`)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </Link>
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
                                            {t(`bestTime.${location.bestTime}`)}
                                        </Badge>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {t(`bestTimeDescription.${location.bestTime}`)}
                                        </p>
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
                                        {t(`items.${slug}.address`)}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}`}
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
                                    <Button asChild variant="secondary" className="w-full font-semibold shadow-lg hover:shadow-xl transition-all">
                                        <Link href="/packages">{t("viewPackages")}</Link>
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

