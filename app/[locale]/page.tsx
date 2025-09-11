import { getTranslations } from "next-intl/server";
import { FAQSectionWithSchema } from "@/components/faq-section-with-schema";
import { GallerySection } from "@/components/gallery-section";
import { HeroSection } from "@/components/hero-section";
import { PackagesSection } from "@/components/packages-section";
import { ReviewsSection } from "@/components/reviews";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import { 
  JsonLd, 
  MultipleJsonLd,
  generateLocalBusinessSchema, 
  generateOrganizationSchema,
  generatePersonSchema,
  createSchemaConfig 
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
      languages: paths.languages,
    },
  };
}

export default async function HomePage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  
  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);
  
  // Generate structured data schemas
  const localBusinessSchema = generateLocalBusinessSchema(schemaConfig);
  const organizationSchema = generateOrganizationSchema(schemaConfig);
  const personSchema = generatePersonSchema(schemaConfig);
  
  const schemas = [localBusinessSchema, organizationSchema, personSchema];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <MultipleJsonLd schemas={schemas} />
      
      <div className="overflow-hidden">
        <HeroSection />
        <GallerySection />
        <PackagesSection />
        <FAQSectionWithSchema locale={locale} />
        <ReviewsSection locale={locale} />
      </div>
    </>
  );
}

