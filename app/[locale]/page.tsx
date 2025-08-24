import { getTranslations } from "next-intl/server";
import { FAQSection } from "@/components/faq-section";
import { GallerySection } from "@/components/gallery-section";
import { HeroSection } from "@/components/hero-section";
import { PackagesSection } from "@/components/packages-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      <HeroSection />
      <GallerySection />
      <PackagesSection />
      <FAQSection />
    </div>
  );
}
