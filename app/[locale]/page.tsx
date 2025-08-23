import { getTranslations } from "next-intl/server";
import { HeroSection } from "@/components/hero-section";
import { GallerySection } from "@/components/gallery-section";
import { PackagesSection } from "@/components/packages-section";
import { AboutSection } from "@/components/about-section";

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
    <div>
      <HeroSection />
      <GallerySection />
      <PackagesSection />
    </div>
  );
}
