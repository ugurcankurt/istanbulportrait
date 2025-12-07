import { getTranslations } from "next-intl/server";
import { FAQSectionWithSchema } from "@/components/faq-section-with-schema";
import { GallerySectionWithSchema } from "@/components/gallery-section-with-schema";
import { HeroSection } from "@/components/hero-section";
import { PackagesSection } from "@/components/packages-section";
import { ReviewsSection } from "@/components/reviews";
import { ToursSection } from "@/components/tours-section";
import { WhyChooseSection } from "@/components/why-choose-section";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
  createSchemaConfig,
  generateEnhancedLocalBusinessSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  MultipleJsonLd,
} from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/", baseUrl);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);

  // Generate structured data schemas with AI Search optimization
  const enhancedLocalBusinessSchema =
    generateEnhancedLocalBusinessSchema(schemaConfig);
  const organizationSchema = generateOrganizationSchema(schemaConfig);
  const personSchema = generatePersonSchema(schemaConfig);

  const schemas = [
    enhancedLocalBusinessSchema,
    organizationSchema,
    personSchema,
  ];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <MultipleJsonLd schemas={schemas} />

      <div className="overflow-hidden">
        <HeroSection />
        <GallerySectionWithSchema locale={locale} />
        <WhyChooseSection />
        <PackagesSection />
        <ToursSection locale={locale} />
        <FAQSectionWithSchema locale={locale} />
        <ReviewsSection locale={locale} />
      </div>
    </>
  );
}
