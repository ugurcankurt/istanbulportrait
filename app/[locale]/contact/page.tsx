import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ContactSection } from "@/components/contact-section";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.contact" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/contact", baseUrl);

  // ContactPage Schema for Rich Results
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${baseUrl}/contact#contactpage`,
    name: "Contact Istanbul Photographer",
    description: "Get in touch for professional photography services in Istanbul",
    url: `${baseUrl}/contact`,
    mainEntity: {
      "@type": "LocalBusiness",
      name: SEO_CONFIG.organization.name,
      telephone: SEO_CONFIG.organization.contactPoint.telephone,
      address: {
        "@type": "PostalAddress",
        addressLocality: SEO_CONFIG.organization.address.addressLocality,
        addressCountry: SEO_CONFIG.organization.address.addressCountry
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 41.0082,
        longitude: 28.9784
      },
      openingHours: "Mo-Su 09:00-18:00",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: SEO_CONFIG.organization.contactPoint.telephone,
        contactType: "customer service",
        areaServed: "Istanbul",
        availableLanguage: ["Turkish", "English", "Arabic", "Russian", "Spanish"]
      }
    }
  };

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
      languages: paths.languages,
    },
  };
}

export default function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <div>
      <ContactPageSchema params={params} />
      <BreadcrumbNav />
      <ContactSection />
    </div>
  );
}

async function ContactPageSchema({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = SEO_CONFIG.site.url;

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${baseUrl}/contact#contactpage`,
    name: "Contact Istanbul Photographer",
    description: "Get in touch for professional photography services in Istanbul",
    url: `${baseUrl}/contact`,
    mainEntity: {
      "@type": "LocalBusiness",
      name: SEO_CONFIG.organization.name,
      telephone: SEO_CONFIG.organization.contactPoint.telephone,
      address: {
        "@type": "PostalAddress",
        addressLocality: SEO_CONFIG.organization.address.addressLocality,
        addressCountry: SEO_CONFIG.organization.address.addressCountry
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 41.0082,
        longitude: 28.9784
      },
      openingHours: "Mo-Su 09:00-18:00",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: SEO_CONFIG.organization.contactPoint.telephone,
        contactType: "customer service",
        areaServed: "Istanbul",
        availableLanguage: ["Turkish", "English", "Arabic", "Russian", "Spanish"]
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(contactSchema),
      }}
    />
  );
}
