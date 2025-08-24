import { useLocale, useTranslations } from "next-intl";

interface StructuredDataProps {
  type:
    | "website"
    | "service"
    | "person"
    | "organization"
    | "reviews"
    | "localbusiness"
    | "article"
    | "howto"
    | "locations";
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
          telephone: "+90-536-709-37-24",
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
          name: "Istanbul Photographer",
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

      case "reviews":
        return {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": `${baseUrl}#business`,
          name: "Istanbul Portrait",
          image: [`${baseUrl}/og-image.jpg`],
          description: t("seo.home.description"),
          url: baseUrl,
          telephone: "+90-536-709-37-24",
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
          priceRange: "€150-€450",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "127",
            bestRating: "5",
            worstRating: "1",
          },
          review: [
            {
              "@type": "Review",
              author: {
                "@type": "Person",
                name: "Sarah Johnson",
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
                bestRating: "5",
              },
              reviewBody:
                "Amazing Istanbul photoshoot experience! Professional photographer with incredible rooftop locations. The photos exceeded all expectations.",
              datePublished: "2024-10-15",
            },
            {
              "@type": "Review",
              author: {
                "@type": "Person",
                name: "Marco Rodriguez",
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
                bestRating: "5",
              },
              reviewBody:
                "Best decision for our Istanbul trip! Beautiful couple photos with Bosphorus views. Highly recommend this photographer.",
              datePublished: "2024-11-02",
            },
            {
              "@type": "Review",
              author: {
                "@type": "Person",
                name: "Emma Thompson",
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
                bestRating: "5",
              },
              reviewBody:
                "Professional, creative, and knows all the best spots in Istanbul. Our rooftop session was magical!",
              datePublished: "2024-11-20",
            },
          ],
        };

      case "localbusiness":
        return {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Istanbul Portrait",
          image: [`${baseUrl}/og-image.jpg`],
          description: t("seo.home.description"),
          url: baseUrl,
          telephone: "+90-536-709-37-24",
          email: "info@istanbulportrait.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Professional Photography Services",
            addressLocality: "Istanbul",
            addressRegion: "Istanbul",
            addressCountry: "TR",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: 41.0082,
            longitude: 28.9784,
          },
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
            opens: "09:00",
            closes: "20:00",
          },
          serviceType: "Photography Services",
          areaServed: {
            "@type": "City",
            name: "Istanbul",
            addressCountry: "TR",
          },
          paymentAccepted: "Cash, Credit Card",
          currenciesAccepted: "EUR, USD, TRY",
          priceRange: "€150-€450",
        };

      case "article":
        if (!data) return {};
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: data.title,
          description: data.description,
          image: data.image
            ? [`${baseUrl}${data.image}`]
            : [`${baseUrl}/og-image.jpg`],
          datePublished: data.publishedTime || data.datePublished,
          dateModified:
            data.modifiedTime ||
            data.dateModified ||
            data.publishedTime ||
            data.datePublished,
          author: {
            "@type": "Person",
            name: data.author || "Istanbul Portrait Team",
            url: baseUrl,
          },
          publisher: {
            "@type": "Organization",
            name: "Istanbul Portrait",
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/istanbulportrait_dark_logo.png`,
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": data.url || baseUrl,
          },
          keywords:
            data.keywords || "istanbul photography, professional photographer",
          wordCount: data.wordCount || 1500,
          articleSection: data.category || "Photography",
          inLanguage: locale,
          about: {
            "@type": "Thing",
            name: "Istanbul Photography",
            description: "Professional photography services in Istanbul",
          },
        };

      case "howto":
        if (!data) return {};
        return {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: data.title,
          description: data.description,
          image: data.image
            ? [`${baseUrl}${data.image}`]
            : [`${baseUrl}/og-image.jpg`],
          datePublished: data.publishedTime || data.datePublished,
          dateModified: data.modifiedTime || data.dateModified,
          author: {
            "@type": "Person",
            name: data.author || "Professional Istanbul Photographer",
            url: baseUrl,
          },
          publisher: {
            "@type": "Organization",
            name: "Istanbul Portrait",
            logo: {
              "@type": "ImageObject",
              url: `${baseUrl}/istanbulportrait_dark_logo.png`,
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": data.url || baseUrl,
          },
          keywords: data.keywords || "photography tips, istanbul photoshoot",
          estimatedCost: {
            "@type": "MonetaryAmount",
            currency: "EUR",
            value: data.estimatedCost || "150-450",
          },
          totalTime: data.totalTime || "PT2H",
          step: data.steps
            ? data.steps.map((step: any, index: number) => ({
                "@type": "HowToStep",
                position: index + 1,
                name: step.name,
                text: step.text,
                image: step.image ? `${baseUrl}${step.image}` : undefined,
              }))
            : [
                {
                  "@type": "HowToStep",
                  position: 1,
                  name: "Plan Your Session",
                  text: "Choose the perfect location and time for your Istanbul photoshoot",
                },
                {
                  "@type": "HowToStep",
                  position: 2,
                  name: "Prepare for the Shoot",
                  text: "Select outfits and plan poses that complement your chosen location",
                },
                {
                  "@type": "HowToStep",
                  position: 3,
                  name: "Execute the Session",
                  text: "Work with your photographer to capture stunning images",
                },
              ],
          tool: data.tools || [
            {
              "@type": "HowToTool",
              name: "Professional Camera Equipment",
            },
            {
              "@type": "HowToTool",
              name: "Professional Lighting Setup",
            },
          ],
          supply: data.supplies || [
            {
              "@type": "HowToSupply",
              name: "Photography Props",
            },
            {
              "@type": "HowToSupply",
              name: "Backup Outfits",
            },
          ],
        };

      case "locations":
        if (!data || !data.locations) return {};
        return {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: data.title || "Best Photography Locations in Istanbul",
          description:
            data.description ||
            "Premium photography locations in Istanbul for professional photoshoots",
          numberOfItems: data.locations.length,
          itemListElement: data.locations.map(
            (location: any, index: number) => ({
              "@type": "Place",
              position: index + 1,
              name: location.name,
              description: location.description,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Istanbul",
                addressCountry: "TR",
              },
              geo: location.coordinates
                ? {
                    "@type": "GeoCoordinates",
                    latitude: location.coordinates.lat,
                    longitude: location.coordinates.lng,
                  }
                : undefined,
              url: `${baseUrl}/locations/${location.slug}`,
            }),
          ),
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
