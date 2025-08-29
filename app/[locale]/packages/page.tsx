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
