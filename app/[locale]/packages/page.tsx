import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackagesHeroSection } from "@/components/packages-hero-section";
import { PackagesSection } from "@/components/packages-section";
import { getLocalizedPaths, getOpenGraphUrl } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
  createSchemaConfig,
  generateItemListSchema,
  generateServiceSchema,
  type ItemListData,
  MultipleJsonLd,
  type PackageData,
} from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.packages" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/packages", baseUrl);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
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

export default async function PackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);

  // Define package data based on SEO_CONFIG
  const packagesData: PackageData[] = SEO_CONFIG.services.offers.map(
    (offer) => ({
      id: offer.name.toLowerCase().replace(/\s+/g, "-"),
      name: offer.name,
      description: offer.description,
      price: Number(offer.price),
      currency: offer.priceCurrency,
      duration:
        offer.name === "Essential Package"
          ? "30 minutes"
          : offer.name === "Premium Package"
            ? "1.5 hours"
            : "2.5 hours",
      included: offer.description.split(" with ")[1]?.split(" at ") || [],
      locations:
        offer.name === "Essential Package"
          ? 1
          : offer.name === "Premium Package"
            ? 2
            : 3,
      photos:
        offer.name === "Essential Package"
          ? 15
          : offer.name === "Premium Package"
            ? 40
            : offer.name === "Luxury Package"
              ? 80
              : 20,
    }),
  );

  // Generate service schemas for each package
  const serviceSchemas = packagesData.map((packageData) =>
    generateServiceSchema(packageData, schemaConfig),
  );

  // Create ItemList data for carousel rich results
  const itemListData: ItemListData[] = packagesData.map((pkg, index) => ({
    name: pkg.name,
    description: `${pkg.description} - ${pkg.price} EUR`,
    url: `${schemaConfig.baseUrl}/packages#${pkg.id}`,
    image: `${schemaConfig.baseUrl}/packages/${pkg.id}-preview.jpg`,
    position: index + 1,
  }));

  // Generate ItemList schema for packages carousel
  const itemListSchema = generateItemListSchema(
    itemListData,
    "Photography Packages in Istanbul",
    schemaConfig,
  );

  return (
    <div>
      {/* JSON-LD Structured Data for Services and Carousel */}
      <MultipleJsonLd schemas={[...serviceSchemas, itemListSchema]} />

      <BreadcrumbNav />
      <PackagesHeroSection />
      <PackagesSection />
    </div>
  );
}
