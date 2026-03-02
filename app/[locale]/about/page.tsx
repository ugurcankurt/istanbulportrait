import { getTranslations } from "next-intl/server";
import { AboutHeroSection } from "@/components/about-hero-section";
import { AboutSection } from "@/components/about-section";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { getLocalizedPaths, getOpenGraphUrl } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
  createSchemaConfig,
  generatePersonSchema,
  JsonLd,
} from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.about" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/about", baseUrl);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: getOpenGraphUrl("/about", locale, baseUrl),
      siteName: SEO_CONFIG.organization.name,
      images: [
        {
          url: SEO_CONFIG.person.image,
          width: 800,
          height: 800,
          alt: `${SEO_CONFIG.person.name} - ${SEO_CONFIG.person.jobTitle}`,
        },
      ],
      locale: locale,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [SEO_CONFIG.person.image],
      creator: "@istanbulportrait",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);

  // Generate Person schema for photographer
  const personSchema = generatePersonSchema(schemaConfig);

  return (
    <div>
      {/* JSON-LD Structured Data for Person */}
      <JsonLd data={personSchema} />

      <BreadcrumbNav />
      <AboutHeroSection />
      <AboutSection />
    </div>
  );
}
