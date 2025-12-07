import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ToursContentSection } from "@/components/tours-content-section";
import { ToursCrossSellSection } from "@/components/tours-cross-sell-section";
import { ToursHeroSection } from "@/components/tours-hero-section";
import { getAllTourIds, TOUR_METADATA } from "@/lib/getyourguide";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
  type BreadcrumbData,
  createSchemaConfig,
  generateBreadcrumbListSchema,
  generateToursListSchema,
  MultipleJsonLd,
  type TourData,
} from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tours.seo" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/tours", baseUrl);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: [
        {
          url: `${baseUrl}/og-tours.jpg`,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
      locale: locale,
      type: "website",
      url: paths.canonical(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`${baseUrl}/og-tours.jpg`],
    },
  };
}

export default async function ToursPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);

  // Generate breadcrumb schema for tours page
  const breadcrumbData: BreadcrumbData[] = [
    { name: "Home", url: `${schemaConfig.baseUrl}/${locale}`, position: 1 },
    {
      name: "Tours & Activities",
      url: `${schemaConfig.baseUrl}/${locale}/tours`,
      position: 2,
    },
  ];
  const breadcrumbSchema = generateBreadcrumbListSchema(
    breadcrumbData,
    schemaConfig,
  );

  // Generate Tour schemas using static metadata
  // This avoids server-side API calls and proxy issues
  const tourIds = getAllTourIds();
  const toursData: TourData[] = tourIds
    .map((id) => {
      const meta = TOUR_METADATA[id];
      if (!meta) return null;

      return {
        id,
        name: meta.name,
        description: `Experience the best of Istanbul with our ${meta.name}. Perfect for ${meta.keywords.join(", ")}.`,
        price: 0, // Price is dynamic, setting 0 or base price for schema
        currency: "EUR",
        duration: "Varies",
        location: "Istanbul",
        rating: 4.8, // Default high rating for schema
        reviewCount: 100, // Default review count
        images: [`${schemaConfig.baseUrl}/tours/${id}.jpg`], // Placeholder image URL
        provider: "GetYourGuide",
        availability: "AVAILABLE",
        bookingUrl: `https://www.getyourguide.com/-t${id}/?partner_id=S6XXHTA`,
        category: meta.category,
      } as TourData;
    })
    .filter((tour): tour is TourData => tour !== null);

  const tourSchemas = generateToursListSchema(toursData, schemaConfig);

  // Combine all schemas
  const allSchemas = [breadcrumbSchema, ...tourSchemas];

  return (
    <div>
      {/* JSON-LD Structured Data for Tours Page */}
      <MultipleJsonLd schemas={allSchemas} />

      <BreadcrumbNav />
      <ToursHeroSection />
      <ToursContentSection locale={locale} />
      <ToursCrossSellSection />
    </div>
  );
}
