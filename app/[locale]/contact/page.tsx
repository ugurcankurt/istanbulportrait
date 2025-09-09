import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ContactSection } from "@/components/contact-section";
import { getLocalizedPaths } from "@/lib/localized-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.contact" });

  const baseUrl = "https://istanbulportrait.com";
  const paths = getLocalizedPaths("/contact", baseUrl);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
      languages: paths.languages,
    },
  };
}

export default function ContactPage() {
  return (
    <div>
      <BreadcrumbNav />
      <ContactSection />
    </div>
  );
}
