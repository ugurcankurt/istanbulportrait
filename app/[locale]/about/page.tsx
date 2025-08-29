import { getTranslations } from "next-intl/server";
import { AboutSection } from "@/components/about-section";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.about" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function AboutPage() {
  return (
    <div>
      <BreadcrumbNav />
      <AboutSection />
    </div>
  );
}
