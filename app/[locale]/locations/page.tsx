import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { LocationCard } from "@/components/location-card";
import { LocationsHeroSection } from "@/components/locations-hero-section";
import { LOCATIONS } from "@/lib/locations/location-data";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
    createSchemaConfig,
    generatePlaceListSchema,
    type PlaceListData,
    MultipleJsonLd,
} from "@/lib/structured-data";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "locations.seo" });

    const baseUrl = SEO_CONFIG.site.url;
    const paths = getLocalizedPaths("/locations", baseUrl);

    return {
        title: t("title"),
        description: t("description"),
        alternates: {
            canonical: paths.canonical(locale),
        },
        openGraph: {
            title: t("title"),
            description: t("description"),
            url: paths.canonical(locale),
            siteName: SEO_CONFIG.organization.name,
            images: [
                {
                    url: `${baseUrl}/og-image.webp`,
                    width: 1200,
                    height: 630,
                    alt: t("title"),
                },
            ],
            locale: locale,
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: t("title"),
            description: t("description"),
            images: [`${baseUrl}/og-image.webp`],
        },
    };
}

export default async function LocationsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "locations" });

    // Create schema configuration
    const schemaConfig = createSchemaConfig(locale);

    // Create PlaceList data for Top Places List
    const placeListData: PlaceListData[] = LOCATIONS.map((location, index) => ({
        name: t(`items.${location.slug}.name`),
        description: t(`items.${location.slug}.shortDescription`),
        url: `${schemaConfig.baseUrl}/${locale}/locations/${location.slug}`,
        image: `${schemaConfig.baseUrl}${location.images.hero}`,
        address: "Istanbul, Turkey",
        geo: location.coordinates,
        position: index + 1,
    }));

    // Generate PlaceList schema for locations (Google Top Places List)
    const itemListSchema = generatePlaceListSchema(
        placeListData,
        "Istanbul Photography Locations",
        schemaConfig
    );

    return (
        <div>
            {/* JSON-LD Structured Data */}
            <MultipleJsonLd schemas={[itemListSchema]} />

            <BreadcrumbNav />
            <LocationsHeroSection />

            {/* Locations Grid */}
            <section className="py-8 sm:py-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                        {LOCATIONS.map((location, index) => (
                            <LocationCard key={location.slug} location={location} index={index} />
                        ))}
                    </div>

                    {/* Intro Text for SEO */}
                    <div className="mt-12 max-w-4xl mx-auto text-center">
                        <p className="text-muted-foreground leading-relaxed">
                            {t("intro")}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
