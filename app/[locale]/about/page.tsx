import { getTranslations } from "next-intl/server";
import { AboutSection } from "@/components/about-section";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.about" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/about", baseUrl);

  // Person/Professional Schema for Rich Results
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}/about#photographer`,
    name: SEO_CONFIG.person.name,
    jobTitle: "Professional Photographer",
    description: "Experienced Istanbul photographer specializing in portrait and lifestyle photography with over 8 years of experience and 500+ successful sessions.",
    url: `${baseUrl}/about`,
    image: `${baseUrl}/og-image.jpg`,
    worksFor: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      url: baseUrl
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: SEO_CONFIG.organization.address.addressLocality,
      addressCountry: SEO_CONFIG.organization.address.addressCountry
    },
    hasOccupation: {
      "@type": "Occupation",
      name: "Photographer",
      occupationLocation: {
        "@type": "City",
        name: "Istanbul"
      }
    },
    knowsAbout: [
      "Portrait Photography",
      "Lifestyle Photography", 
      "Professional Photography",
      "Istanbul Photography",
      "Digital Photography"
    ],
    sameAs: SEO_CONFIG.organization.sameAs
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

export default function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <div>
      <AboutPageSchema params={params} />
      <BreadcrumbNav />
      <AboutSection />
    </div>
  );
}

async function AboutPageSchema({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = SEO_CONFIG.site.url;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${baseUrl}/about#photographer`,
    name: SEO_CONFIG.person.name,
    jobTitle: "Professional Photographer",
    description: "Experienced Istanbul photographer specializing in portrait and lifestyle photography with over 8 years of experience and 500+ successful sessions.",
    url: `${baseUrl}/about`,
    image: `${baseUrl}/og-image.jpg`,
    worksFor: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      url: baseUrl
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: SEO_CONFIG.organization.address.addressLocality,
      addressCountry: SEO_CONFIG.organization.address.addressCountry
    },
    hasOccupation: {
      "@type": "Occupation",
      name: "Photographer",
      occupationLocation: {
        "@type": "City",
        name: "Istanbul"
      }
    },
    knowsAbout: [
      "Portrait Photography",
      "Lifestyle Photography", 
      "Professional Photography",
      "Istanbul Photography",
      "Digital Photography"
    ],
    sameAs: SEO_CONFIG.organization.sameAs
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(personSchema),
      }}
    />
  );
}
