import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackagesSection } from "@/components/packages-section";
import { getLocalizedPaths, getOpenGraphUrl } from "@/lib/localized-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.packages" });

  const baseUrl = "https://istanbulportrait.com";
  const paths = getLocalizedPaths("/packages", baseUrl);

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
      siteName: "Istanbul Photographer",
      images: [
        {
          url: "https://istanbulportrait.com/og-image.jpg",
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
      "product:google_product_category": "Arts & Entertainment > Hobbies & Creative Arts > Photography",
      "og:type": "product.group",
    },
  };
}

export default function PackagesPage() {
  return (
    <div>
      <BreadcrumbNav />
      <PackagesSection />
    </div>
  );
}
