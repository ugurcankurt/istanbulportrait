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

