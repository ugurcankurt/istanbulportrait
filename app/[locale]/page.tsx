import { getTranslations } from "next-intl/server";
import { FAQSection } from "@/components/faq-section";
import { GallerySection } from "@/components/gallery-section";
import { HeroSection } from "@/components/hero-section";
import { PackagesSection } from "@/components/packages-section";
import { ReviewsSection } from "@/components/reviews";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/", baseUrl);

  // LocalBusiness Schema for Rich Results
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#localbusiness`,
    name: SEO_CONFIG.organization.name,
    image: [
      `${baseUrl}/og-image.jpg`,
      ...SEO_CONFIG.images.gallery
    ],
    description: SEO_CONFIG.site.description,
    url: baseUrl,
    telephone: SEO_CONFIG.organization.contactPoint.telephone,
    address: {
      "@type": "PostalAddress",
      addressLocality: SEO_CONFIG.organization.address.addressLocality,
      addressCountry: SEO_CONFIG.organization.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.0082,
      longitude: 28.9784
    },
    openingHoursSpecification: SEO_CONFIG.business.openingHours.map(hours => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.includes("Monday-Friday") ? 
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] : 
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "18:00"
    })),
    priceRange: SEO_CONFIG.business.priceRange,
    currenciesAccepted: SEO_CONFIG.business.currenciesAccepted,
    paymentAccepted: SEO_CONFIG.business.paymentAccepted,
    serviceArea: {
      "@type": "City",
      name: "Istanbul"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "50",
      bestRating: "5"
    },
    sameAs: SEO_CONFIG.organization.sameAs
  };

  // FAQ Schema for Rich Results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What makes you the best Istanbul photographer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "With 8+ years of experience and over 500 successful photography sessions, I specialize in capturing Istanbul's unique beauty. My deep local knowledge of the city's most photogenic locations ensures exceptional results every time."
        }
      },
      {
        "@type": "Question",
        name: "Which locations do you recommend for Istanbul photoshoots?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "I offer sessions at premium rooftop venues with stunning Bosphorus views, historic areas like Sultanahmet, Galata Tower surroundings, Ortaköy Mosque, and hidden gems throughout the city."
        }
      },
      {
        "@type": "Question", 
        name: "How long does an Istanbul photography session take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Session durations vary by package: Essential (30 minutes), Premium (1.5 hours), Luxury (2.5 hours), and custom rooftop sessions."
        }
      }
    ]
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

export default function HomePage() {
  return (
    <>
      <HomePageSchema />
      <div className="overflow-hidden">
        <HeroSection />
        <GallerySection />
        <PackagesSection />
        <FAQSection />
        <ReviewsSection />
      </div>
    </>
  );
}

async function HomePageSchema() {
  const baseUrl = SEO_CONFIG.site.url;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#localbusiness`,
    name: SEO_CONFIG.organization.name,
    image: [
      `${baseUrl}/og-image.jpg`,
      ...SEO_CONFIG.images.gallery
    ],
    description: SEO_CONFIG.site.description,
    url: baseUrl,
    telephone: SEO_CONFIG.organization.contactPoint.telephone,
    address: {
      "@type": "PostalAddress",
      addressLocality: SEO_CONFIG.organization.address.addressLocality,
      addressCountry: SEO_CONFIG.organization.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.0082,
      longitude: 28.9784
    },
    openingHoursSpecification: SEO_CONFIG.business.openingHours.map(hours => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: hours.includes("Monday-Friday") ? 
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] : 
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "18:00"
    })),
    priceRange: SEO_CONFIG.business.priceRange,
    currenciesAccepted: SEO_CONFIG.business.currenciesAccepted,
    paymentAccepted: SEO_CONFIG.business.paymentAccepted,
    serviceArea: {
      "@type": "City",
      name: "Istanbul"
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5.0",
      reviewCount: "50",
      bestRating: "5"
    },
    sameAs: SEO_CONFIG.organization.sameAs
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What makes you the best Istanbul photographer?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "With 8+ years of experience and over 500 successful photography sessions, I specialize in capturing Istanbul's unique beauty. My deep local knowledge of the city's most photogenic locations ensures exceptional results every time."
        }
      },
      {
        "@type": "Question",
        name: "Which locations do you recommend for Istanbul photoshoots?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "I offer sessions at premium rooftop venues with stunning Bosphorus views, historic areas like Sultanahmet, Galata Tower surroundings, Ortaköy Mosque, and hidden gems throughout the city."
        }
      },
      {
        "@type": "Question", 
        name: "How long does an Istanbul photography session take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Session durations vary by package: Essential (30 minutes), Premium (1.5 hours), Luxury (2.5 hours), and custom rooftop sessions."
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([localBusinessSchema, faqSchema]),
      }}
    />
  );
}
