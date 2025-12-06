import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import {
    getAllLocationSlugs,
    getLocationBySlug,
} from "@/lib/locations/location-data";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
    createSchemaConfig,
    generateBreadcrumbListSchema,
    type BreadcrumbData,
    MultipleJsonLd,
} from "@/lib/structured-data";
import { Camera, Clock, MapPin, Star } from "lucide-react";

// Generate static params for all locations
export async function generateStaticParams() {
    const slugs = getAllLocationSlugs();
    return slugs.map((slug) => ({ slug }));
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
            languages: {
                en: `${baseUrl}/en/locations/${slug}`,
                ar: `${baseUrl}/ar/mawaqe/${slug}`,
                ru: `${baseUrl}/ru/lokatsii/${slug}`,
                es: `${baseUrl}/es/ubicaciones/${slug}`,
                zh: `${baseUrl}/zh/didian/${slug}`,
                "x-default": `${baseUrl}/en/locations/${slug}`,
            },
        },
        openGraph: {
            title: t(`items.${slug}.seoTitle`),
            description: t(`items.${slug}.seoDescription`),
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

    // Generate Place schema
    const placeSchema = {
        "@context": "https://schema.org" as const,
        "@type": "Place" as const,
        "@id": `${schemaConfig.baseUrl}/${locale}/locations/${slug}#place`,
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
        <div>
            {/* JSON-LD Structured Data */}
            <MultipleJsonLd schemas={[placeSchema, breadcrumbSchema]} />

            <BreadcrumbNav />

            {/* Hero Section */}
            <section className="relative">
                <div className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] overflow-hidden">
                    <Image
                        src={location.images.hero}
                        alt={t(`items.${slug}.name`)}
                        fill
                        priority
                        className="object-cover"
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
                        <div className="container mx-auto">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                                {t(`items.${slug}.name`)}
                            </h1>
                            <p className="text-lg sm:text-xl text-white/90 max-w-2xl">
                                {t(`items.${slug}.shortDescription`)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="py-12 lg:py-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Description */}
                            <div>
                                <h2 className="text-2xl font-bold mb-4">
                                    {t("aboutLocation")}
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    {t(`items.${slug}.description`)}
                                </p>
                            </div>

                            {/* Photography Tips */}
                            <div>
                                <h2 className="text-2xl font-bold mb-4">
                                    {t("photographyTips")}
                                </h2>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {location.photographyTips.map((tip) => (
                                        <Card key={tip}>
                                            <CardContent className="p-4 flex items-start gap-3">
                                                <Camera className="w-5 h-5 text-primary mt-0.5" />
                                                <div>
                                                    <h3 className="font-medium">
                                                        {t(`tips.${tip}.title`)}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {t(`tips.${tip}.description`)}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Gallery */}
                            {location.images.gallery.length > 0 && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-4">{t("gallery")}</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {location.images.gallery.map((img, index) => (
                                            <div
                                                key={index}
                                                className="relative aspect-[4/3] rounded-lg overflow-hidden"
                                            >
                                                <Image
                                                    src={img}
                                                    alt={`${t(`items.${slug}.name`)} photo ${index + 1}`}
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-500"
                                                    sizes="(max-width: 768px) 50vw, 33vw"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Best Time Card */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-bold mb-4 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-primary" />
                                        {t("bestTimeToVisit")}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {t(`bestTime.${location.bestTime}`)} -{" "}
                                        {t(`bestTimeDescription.${location.bestTime}`)}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Location Card */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-bold mb-4 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-primary" />
                                        {t("locationInfo")}
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        {t(`items.${slug}.address`)}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-sm"
                                    >
                                        {t("viewOnMap")}
                                    </a>
                                </CardContent>
                            </Card>

                            {/* CTA Card */}
                            <Card className="bg-primary text-primary-foreground">
                                <CardContent className="p-6 text-center">
                                    <Star className="w-8 h-8 mx-auto mb-3" />
                                    <h3 className="font-bold text-lg mb-2">
                                        {t("bookPhotoshoot")}
                                    </h3>
                                    <p className="text-primary-foreground/80 text-sm mb-4">
                                        {t("bookPhotoshootDescription")}
                                    </p>
                                    <Button asChild variant="secondary" className="w-full">
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
