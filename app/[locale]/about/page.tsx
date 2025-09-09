import { getTranslations } from "next-intl/server";
import { AboutSection } from "@/components/about-section";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { getLocalizedPaths } from "@/lib/localized-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.about" });

  const baseUrl = "https://istanbulportrait.com";
  const paths = getLocalizedPaths("/about", baseUrl);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
      languages: paths.languages,
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
