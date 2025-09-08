import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PackagesSection } from "@/components/packages-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.packages" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `https://istanbulportrait.com/${locale}/packages`,
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
