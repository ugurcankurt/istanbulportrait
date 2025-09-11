import { getTranslations } from "next-intl/server";
import { AboutSection } from "@/components/about-section";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { SEOLayout } from "@/components/seo/seo-layout";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.about" });

  const baseUrl = SEO_CONFIG.site.url;
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
    <SEOLayout>
      <div>
        <BreadcrumbNav />
        <AboutSection />
      </div>
    </SEOLayout>
  );
}
