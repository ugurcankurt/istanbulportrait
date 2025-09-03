import { useLocale, useTranslations } from "next-intl";

interface StructuredDataProps {
  type:
    | "website"
    | "service"
    | "person"
    | "organization"
    | "localbusiness"
    | "article"
    | "howto"
    | "locations"
    | "breadcrumblist"
    | "imageobject"
    | "offer"
    | "event"
    | "carousel";
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
          name: "Istanbul Photographer - Professional Photography Services",
          url: baseUrl,
          description: t("seo.home.description"),
          potentialAction: [
            {
              "@type": "SearchAction",
              target: `${baseUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
            {
              "@type": "Action",
              name: "Book Photography Session",
              target: `${baseUrl}/checkout`,
            },
          ],
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
          name: "Istanbul Photographer - Professional Photography Services",
          image: [
            {
              "@type": "ImageObject",
              url: `${baseUrl}/og-image.jpg`,
              width: 1200,
              height: 630,
              caption:
                "Istanbul Photographer Professional Photography Services",
            },
            {
              "@type": "ImageObject",
              url: `${baseUrl}/istanbulportrait_dark_logo.png`,
              width: 400,
              height: 200,
              caption: "Istanbul Photographer Logo",
            },
            {
              "@type": "ImageObject",
              url: `${baseUrl}/istanbulportprat_ugur_cankurt.jpg`,
              width: 800,
              height: 1000,
              caption: "Professional Istanbul Photographer Uğur Cankurt",
            },
          ],
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/istanbulportrait_dark_logo.png`,
            width: 400,
            height: 200,
          },
          description: t("seo.home.description"),
          url: baseUrl,
          telephone: "+90-536-709-37-24",
          email: "info@istanbulportrait.com",
          foundingDate: "2016",
          founder: {
            "@type": "Person",
            name: "Uğur Cankurt",
            jobTitle: "Professional Photographer",
            image: `${baseUrl}/istanbulportprat_ugur_cankurt.jpg`,
            knowsAbout: [
              "Portrait Photography",
              "Wedding Photography",
              "Couple Photography",
              "Rooftop Photography",
              "Istanbul Photography",
            ],
            hasCredential: [
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "Professional Experience",
                name: "8+ Years Professional Photography Experience",
              },
              {
                "@type": "EducationalOccupationalCredential",
                credentialCategory: "Client Success",
                name: "500+ Successful Photography Sessions",
              },
            ],
          },
          address: {
            "@type": "PostalAddress",
            streetAddress: "Alemdar, Molla Fenari, Divan Yolu Cd. No:78/A",
            addressLocality: "Istanbul",
            postalCode: "34110",
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
            "https://www.linkedin.com/in/istanbulphotographer",
            "https://www.pinterest.com/istanbulphotographer",
          ],
          awards: [
            "Top-Rated Photography Service Istanbul 2024",
            "Best Rooftop Photography Experience 2024",
          ],
        };

      case "service":
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Professional Photography Services in Istanbul",
          provider: {
            "@type": "ProfessionalService",
            name: "Istanbul Photographer - Professional Photography Services",
            priceRange: "€150-€450",
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
          name: "Istanbul Photographer - Professional Photography Services",
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

      case "localbusiness":
        return {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": `${baseUrl}#business`,
          name: "Istanbul Photographer - Professional Photography Services",
          image: [
            {
              "@type": "ImageObject",
              url: `${baseUrl}/og-image.jpg`,
              width: 1200,
              height: 630,
              caption:
                "Istanbul Photographer Professional Photography Services",
            },
          ],
          description: t("seo.home.description"),
          url: baseUrl,
          telephone: "+90-536-709-37-24",
          email: "info@istanbulportrait.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Alemdar, Molla Fenari, Divan Yolu Cd. No:78/A",
            addressLocality: "Istanbul",
            addressRegion: "Istanbul",
            postalCode: "34110",
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
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: "156",
            bestRating: "5",
            worstRating: "1",
          },
          review: [
            {
              "@type": "Review",
              author: {
                "@type": "Person",
                name: "Balal Ahmed",
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
                bestRating: "5",
              },
              reviewBody:
                "An Incredible Rooftop Photography Experience with Uğur! Me and my wife had the absolute pleasure of doing a rooftop photography session with Uğur on the 9th of July, and we couldn't be happier with the entire experience! From start to finish, Uğur was incredibly professional, friendly, and welcoming, making us feel completely at ease throughout the shoot.The rooftop setting was stunning, and Uğur eye for capturing beautiful, natural moments truly impressed us. He guided us perfectly, making the whole experience fun and relaxed while still delivering high-quality, artistic photos that we will treasure forever. On top of the fantastic service, the pricing was very reasonable for the level of quality and care we received. It genuinely felt like a premium experience at a great value. We would highly recommend Uğur to anyone looking for a memorable and beautifully executed photo session. Amazing service all around thank you, Uğur, for making our day so special!",
              datePublished: "2025-07-15",
            },
            {
              "@type": "Review",
              author: {
                "@type": "Person",
                name: "Xhuljana Cukaj",
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: "4.5",
                bestRating: "5",
              },
              reviewBody:
                "Amazing photographer! Captured Istanbul beautifully and made the whole experience fun and relaxed. The photos turned out stunning—highly recommended!",
              datePublished: "2025-04-02",
            },
            {
              "@type": "Review",
              author: {
                "@type": "Person",
                name: "Dima Kaaki",
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: "4.5",
                bestRating: "5",
              },
              reviewBody:
                "Perfect spot!! I've had the most beautiful photo session ever!! Very recommended. If you are visiting istanbul this would be an unforgettable memory",
              datePublished: "2025-08-01",
            },
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
                "Absolutely incredible experience with Istanbul Photographer! The rooftop photoshoot exceeded all my expectations. Professional, creative, and the photos are breathtaking. Highly recommend for anyone visiting Istanbul!",
              datePublished: "2025-01-15",
            },
            {
              "@type": "Review",
              author: {
                "@type": "Person",
                name: "Marco Rossi",
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
                bestRating: "5",
              },
              reviewBody:
                "Best photography experience in Istanbul! The photographer knows all the perfect spots and angles. We got amazing shots at historic locations. Professional service, fair prices. Worth every penny!",
              datePublished: "2025-01-10",
            },
            {
              "@type": "Review",
              author: {
                "@type": "Person",
                name: "Elena Petrov",
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: "4.5",
                bestRating: "5",
              },
              reviewBody:
                "Great professional photographer in Istanbul. Captured beautiful moments during our couple session. Good communication, timely delivery, and excellent photo quality. Recommended!",
              datePublished: "2025-01-08",
            },
          ],
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
            name: data.author || "Istanbul Photographer Team",
            url: baseUrl,
          },
          publisher: {
            "@type": "Organization",
            name: "Istanbul Photographer",
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
            name: "Istanbul Photographer",
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

      case "breadcrumblist":
        if (!data || !data.items) return {};
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: data.items.map((item: any, index: number) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url ? `${baseUrl}${item.url}` : undefined,
          })),
        };

      case "imageobject":
        if (!data) return {};
        return {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          url: data.url ? `${baseUrl}${data.url}` : undefined,
          caption:
            data.caption || "Istanbul Photographer Professional Photography",
          creator: {
            "@type": "Person",
            name: "Istanbul Photographer",
            url: baseUrl,
          },
          creditText: "Istanbul Photographer",
          license: `${baseUrl}/license`,
          contentLocation: {
            "@type": "Place",
            name: "Istanbul, Turkey",
          },
          keywords: data.keywords || [
            "istanbul photographer",
            "istanbul photoshoot",
            "professional photography",
          ],
        };

      case "offer":
        if (!data) return {};
        return {
          "@context": "https://schema.org",
          "@type": "Offer",
          name: data.name,
          description: data.description,
          price: data.price,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          itemOffered: {
            "@type": "Service",
            name: data.serviceName || data.name,
            provider: {
              "@type": "ProfessionalService",
              name: "Istanbul Photographer",
              url: baseUrl,
            },
            serviceType: "Photography",
            areaServed: {
              "@type": "City",
              name: "Istanbul",
              addressCountry: "TR",
            },
          },
          seller: {
            "@type": "Organization",
            name: "Istanbul Photographer",
            url: baseUrl,
          },
          validFrom: data.validFrom || new Date().toISOString().split("T")[0],
          url: data.url ? `${baseUrl}${data.url}` : `${baseUrl}/packages`,
        };

      case "event": {
        if (!data) return {};

        // Ensure required dates are present
        const startDate =
          data.startDate ||
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
        const endDate =
          data.endDate ||
          new Date(
            Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
          ).toISOString(); // Tomorrow + 2 hours

        return {
          "@context": "https://schema.org",
          "@type": "Event",
          name: data.name || "Istanbul Photography Session",
          description:
            data.description ||
            "Professional photography session in Istanbul with stunning city views",
          startDate: startDate,
          endDate: endDate,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: {
            "@type": "Place",
            name: data.locationName || "Istanbul Photography Locations",
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
          },
          organizer: {
            "@type": "Organization",
            name: "Istanbul Photographer",
            url: baseUrl,
          },
          performer: {
            "@type": "Person",
            name: "Istanbul Photographer",
            url: baseUrl,
          },
          offers: data.offers
            ? {
                "@type": "Offer",
                price: data.offers.price,
                priceCurrency: "EUR",
                availability: "https://schema.org/InStock",
                url: `${baseUrl}/checkout`,
              }
            : undefined,
          image: data.image
            ? `${baseUrl}${data.image}`
            : `${baseUrl}/og-image.jpg`,
          url: `${baseUrl}/checkout`,
        };
      }

      case "carousel":
        if (!data || !data.items) return {};
        return {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: data.name || "Istanbul Photography Gallery",
          description:
            data.description ||
            "Professional photography portfolio showcasing Istanbul's beauty",
          numberOfItems: data.items.length,
          itemListElement: data.items.map((item: any, index: number) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Photograph",
              "@id": `${baseUrl}${item.url}#photograph-${item.id}`,
              name: item.name || item.alt,
              description: item.description || item.alt,
              url: `${baseUrl}${item.url}`,
              image: {
                "@type": "ImageObject",
                url: `${baseUrl}${item.src}`,
                caption: item.alt,
                width: item.width || 1200,
                height: item.height || 800,
              },
              creator: {
                "@type": "Person",
                name: "Istanbul Photographer",
                url: baseUrl,
              },
              locationCreated: {
                "@type": "Place",
                name: item.location || "Istanbul, Turkey",
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Istanbul",
                  addressCountry: "TR",
                },
              },
              keywords:
                item.keywords || item.alt.split(" ").slice(0, 5).join(", "),
              contentLocation: {
                "@type": "Place",
                name: "Istanbul, Turkey",
              },
            },
          })),
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
