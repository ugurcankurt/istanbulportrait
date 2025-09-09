import { getTranslations } from "next-intl/server";
import { FAQSection } from "@/components/faq-section";
import { GallerySection } from "@/components/gallery-section";
import { HeroSection } from "@/components/hero-section";
import { PackagesSection } from "@/components/packages-section";
import { ReviewsSection } from "@/components/reviews";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });

  const baseUrl = "https://istanbulportrait.com";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        ar: `${baseUrl}/ar`,
        ru: `${baseUrl}/ru`,
        es: `${baseUrl}/es`,
      },
    },
  };
}

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <GallerySection />
      <PackagesSection />
      <FAQSection />
      <ReviewsSection />
    </div>
  );
}
