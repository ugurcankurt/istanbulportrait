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

  const baseUrl = "https://istanbulportrait.com";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}/${locale}/about`,
      languages: {
        en: `${baseUrl}/en/about`,
        ar: `${baseUrl}/ar/about`,
        ru: `${baseUrl}/ru/about`,
        es: `${baseUrl}/es/about`,
      },
    },
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
