import { useTranslations, useLocale } from "next-intl";

interface StructuredDataProps {
  type: "website" | "service" | "person" | "organization";
  data?: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const t = useTranslations();
  const locale = useLocale();

  const getStructuredData = () => {
    const baseUrl = "https://istanbulportrait.com";

    switch (type) {
      case "website":
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Istanbul Portrait",
          url: baseUrl,
          description: t("seo.home.description"),
          potentialAction: {
            "@type": "SearchAction",
            target: `${baseUrl}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
          inLanguage: [
            { "@type": "Language", name: "English", alternateName: "en" },
            { "@type": "Language", name: "Arabic", alternateName: "ar" },
            { "@type": "Language", name: "Russian", alternateName: "ru" },
            { "@type": "Language", name: "Spanish", alternateName: "es" },
          ],
        };

      case "organization":
        return {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "@id": `${baseUrl}#organization`,
          name: "Istanbul Portrait",
          image: [`${baseUrl}/og-image.jpg`],
          description: t("seo.home.description"),
          url: baseUrl,
          telephone: "+90-XXX-XXX-XX-XX",
          email: "info@istanbulportrait.com",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Istanbul",
            addressCountry: "TR",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 41.0082,
            longitude: 28.9784,
          },
          serviceType: "Photography Services",
          areaServed: {
            "@type": "City",
            name: "Istanbul",
            addressCountry: "TR",
          },
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Photography Services",
            itemListElement: [
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Portrait Photography",
                  description: "Professional portrait photography sessions",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Rooftop Photoshoot",
                  description:
                    "Rooftop photography sessions with Istanbul views",
                },
              },
              {
                "@type": "Offer",
                itemOffered: {
                  "@type": "Service",
                  name: "Couple Photography",
                  description: "Romantic couple photography sessions",
                },
              },
            ],
          },
          sameAs: [
            "https://instagram.com/istanbulportrait",
            "https://facebook.com/istanbulportrait",
          ],
        };

      case "service":
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Professional Photography Services in Istanbul",
          provider: {
            "@type": "ProfessionalService",
            name: "Istanbul Portrait",
            url: baseUrl,
          },
          description:
            "Professional portrait and lifestyle photography sessions in Istanbul featuring rooftop views and historic landmarks",
          serviceType: "Photography",
          areaServed: {
            "@type": "City",
            name: "Istanbul",
            addressCountry: "TR",
          },
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Photography Packages",
            itemListElement: [
              {
                "@type": "Offer",
                price: "150",
                priceCurrency: "EUR",
                name: "Essential Package",
                description: "1 hour photoshoot with 15 edited photos",
                itemOffered: {
                  "@type": "Service",
                  name: "Essential Photography Package",
                },
              },
              {
                "@type": "Offer",
                price: "280",
                priceCurrency: "EUR",
                name: "Premium Package",
                description: "2 hour photoshoot with 40 edited photos",
                itemOffered: {
                  "@type": "Service",
                  name: "Premium Photography Package",
                },
              },
              {
                "@type": "Offer",
                price: "450",
                priceCurrency: "EUR",
                name: "Luxury Package",
                description: "4 hour photoshoot with 80 edited photos",
                itemOffered: {
                  "@type": "Service",
                  name: "Luxury Photography Package",
                },
              },
            ],
          },
        };

      case "person":
        return {
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Istanbul Portrait Photographer",
          jobTitle: "Professional Photographer",
          description:
            "Professional portrait photographer specializing in Istanbul photography sessions",
          knowsAbout: [
            "Portrait Photography",
            "Couple Photography",
            "Rooftop Photography",
            "Istanbul Photography",
            "Lifestyle Photography",
          ],
          workLocation: {
            "@type": "City",
            name: "Istanbul",
            addressCountry: "TR",
          },
          hasOccupation: {
            "@type": "Occupation",
            name: "Photographer",
            occupationalCategory:
              "Arts, Design, Entertainment, Sports, and Media Occupations",
          },
        };

      default:
        return {};
    }
  };

  const structuredData = getStructuredData();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
