import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ContactHeroSection } from "@/components/contact-hero-section";
import { ContactSection } from "@/components/contact-section";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
  createSchemaConfig,
  generateHowToSchema,
  type HowToStepData,
  MultipleJsonLd,
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
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);

  // Define HowTo steps for photography booking process
  const bookingSteps: HowToStepData[] = [
    {
      name: "Contact the Photographer",
      text: "Reach out via WhatsApp, email, or contact form to discuss your photography needs and preferences.",
      url: `${schemaConfig.baseUrl}/contact`,
    },
    {
      name: "Choose Your Package",
      text: "Select from Essential, Premium, Luxury, or Rooftop photography packages based on your requirements.",
      url: `${schemaConfig.baseUrl}/packages`,
    },
    {
      name: "Schedule Your Session",
      text: "Coordinate with the photographer to find the best date, time, and locations for your photoshoot.",
    },
    {
      name: "Prepare for the Shoot",
      text: "Follow the photographer's guidance on clothing, styling, and what to expect during the session.",
    },
    {
      name: "Professional Photoshoot",
      text: "Enjoy your professional photography session at iconic Istanbul locations with expert guidance.",
    },
    {
      name: "Receive Your Photos",
      text: "Get your professionally edited high-resolution photos delivered within the agreed timeframe.",
    },
  ];

  // Generate HowTo schema for booking process
  const howToSchema = generateHowToSchema(
    bookingSteps,
    "How to Book a Photography Session in Istanbul",
    "Complete guide to booking professional photography services in Istanbul, from initial contact to receiving your final photos.",
    schemaConfig,
  );

  return (
    <div>
      {/* JSON-LD Structured Data for Booking Process */}
      <MultipleJsonLd schemas={[howToSchema]} />

      <BreadcrumbNav />
      <ContactHeroSection />
      <ContactSection />
    </div>
  );
}
