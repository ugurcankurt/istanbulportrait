import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ToursContentSection } from "@/components/tours-content-section";
import { ToursCrossSellSection } from "@/components/tours-cross-sell-section";
import { ToursHeroSection } from "@/components/tours-hero-section";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
  type BreadcrumbData,
  createSchemaConfig,
  generateBreadcrumbListSchema,
  generateLocalBusinessSchema,
  MultipleJsonLd,
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
      languages: paths.languages,
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

  // Generate LocalBusiness schema for the tours page
  const localBusinessSchema = generateLocalBusinessSchema(schemaConfig);

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

  // Skip server-side tour fetching to avoid API proxy issues during SSR
  // Tours will be loaded on client-side in ToursContentSection
  const tourSchemas: never[] = [];

  // Combine all schemas
  const allSchemas = [localBusinessSchema, breadcrumbSchema, ...tourSchemas];

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
