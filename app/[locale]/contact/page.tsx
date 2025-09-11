import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ContactSection } from "@/components/contact-section";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import { 
  JsonLd,
  generateLocalBusinessSchema, 
  createSchemaConfig 
} from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.contact" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/contact", baseUrl);


  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
      languages: paths.languages,
    },
  };
}

export default async function ContactPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  
  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);
  
  // Generate LocalBusiness schema for contact page
  const localBusinessSchema = generateLocalBusinessSchema(schemaConfig);
  
  return (
    <div>
      {/* JSON-LD Structured Data for Local Business Contact */}
      <JsonLd data={localBusinessSchema} />
      
      <BreadcrumbNav />
      <ContactSection />
    </div>
  );
}

