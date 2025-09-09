import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ContactSection } from "@/components/contact-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.contact" });

  const baseUrl = "https://istanbulportrait.com";

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}/${locale}/contact`,
      languages: {
        en: `${baseUrl}/en/contact`,
        ar: `${baseUrl}/ar/contact`,
        ru: `${baseUrl}/ru/contact`,
        es: `${baseUrl}/es/contact`,
      },
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
