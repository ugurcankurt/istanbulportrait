import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackagesSection } from "@/components/packages-section";
import { getLocalizedPaths, getOpenGraphUrl } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.packages" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/packages", baseUrl);

  // Product/Service Schema for Rich Results
  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Istanbul Photography Packages",
    description: "Professional photography packages for Istanbul photoshoots",
    numberOfItems: 4,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Service",
          "@id": `${baseUrl}/packages#essential`,
          name: "Essential Package",
          description: "Perfect for quick professional photos in Istanbul's iconic locations",
          provider: {
            "@type": "LocalBusiness",
            name: SEO_CONFIG.organization.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Istanbul",
              addressCountry: "TR"
            }
          },
          offers: {
            "@type": "Offer",
            price: "150",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "50"
          }
        }
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "Service",
          "@id": `${baseUrl}/packages#premium`,
          name: "Premium Package",
          description: "Extended photography session with multiple Istanbul locations",
          provider: {
            "@type": "LocalBusiness",
            name: SEO_CONFIG.organization.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Istanbul",
              addressCountry: "TR"
            }
          },
          offers: {
            "@type": "Offer",
            price: "250",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "50"
          }
        }
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "Service",
          "@id": `${baseUrl}/packages#luxury`,
          name: "Luxury Package",
          description: "Premium photography experience with exclusive Istanbul locations",
          provider: {
            "@type": "LocalBusiness",
            name: SEO_CONFIG.organization.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Istanbul",
              addressCountry: "TR"
            }
          },
          offers: {
            "@type": "Offer",
            price: "400",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "50"
          }
        }
      },
      {
        "@type": "ListItem",
        position: 4,
        item: {
          "@type": "Service",
          "@id": `${baseUrl}/packages#rooftop`,
          name: "Rooftop Package",
          description: "Exclusive rooftop photography with stunning Bosphorus views",
          provider: {
            "@type": "LocalBusiness",
            name: SEO_CONFIG.organization.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Istanbul",
              addressCountry: "TR"
            }
          },
          offers: {
            "@type": "Offer",
            price: "500",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "50"
          }
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
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: getOpenGraphUrl("/packages", locale, baseUrl),
      siteName: SEO_CONFIG.organization.name,
      images: [
        {
          url: `${baseUrl}${SEO_CONFIG.images.ogImage}`,
          width: 1200,
          height: 630,
          alt: "Istanbul Photography Packages",
        },
      ],
      locale,
      type: "website",
    },
    other: {
      // Facebook Commerce Manager OpenGraph Product Tags
      "product:retailer_item_id": "istanbul-photography-packages",
      "product:brand": "Istanbul Photographer",
      "product:availability": "in stock",
      "product:price:currency": "EUR",
      "product:google_product_category":
        "Arts & Entertainment > Hobbies & Creative Arts > Photography",
      "og:type": "product.group",
    },
  };
}

export default function PackagesPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <div>
      <PackagesPageSchema params={params} />
      <BreadcrumbNav />
      <PackagesSection />
    </div>
  );
}

async function PackagesPageSchema({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const baseUrl = SEO_CONFIG.site.url;

  const servicesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Istanbul Photography Packages",
    description: "Professional photography packages for Istanbul photoshoots",
    numberOfItems: 4,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Service",
          "@id": `${baseUrl}/packages#essential`,
          name: "Essential Package",
          description: "Perfect for quick professional photos in Istanbul's iconic locations",
          provider: {
            "@type": "LocalBusiness",
            name: SEO_CONFIG.organization.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Istanbul",
              addressCountry: "TR"
            }
          },
          offers: {
            "@type": "Offer",
            price: "150",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "50"
          }
        }
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "Service",
          "@id": `${baseUrl}/packages#premium`,
          name: "Premium Package",
          description: "Extended photography session with multiple Istanbul locations",
          provider: {
            "@type": "LocalBusiness",
            name: SEO_CONFIG.organization.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Istanbul",
              addressCountry: "TR"
            }
          },
          offers: {
            "@type": "Offer",
            price: "250",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "50"
          }
        }
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "Service",
          "@id": `${baseUrl}/packages#luxury`,
          name: "Luxury Package",
          description: "Premium photography experience with exclusive Istanbul locations",
          provider: {
            "@type": "LocalBusiness",
            name: SEO_CONFIG.organization.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Istanbul",
              addressCountry: "TR"
            }
          },
          offers: {
            "@type": "Offer",
            price: "400",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "50"
          }
        }
      },
      {
        "@type": "ListItem",
        position: 4,
        item: {
          "@type": "Service",
          "@id": `${baseUrl}/packages#rooftop`,
          name: "Rooftop Package",
          description: "Exclusive rooftop photography with stunning Bosphorus views",
          provider: {
            "@type": "LocalBusiness",
            name: SEO_CONFIG.organization.name,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Istanbul",
              addressCountry: "TR"
            }
          },
          offers: {
            "@type": "Offer",
            price: "500",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "5.0",
            reviewCount: "50"
          }
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(servicesSchema),
      }}
    />
  );
}
