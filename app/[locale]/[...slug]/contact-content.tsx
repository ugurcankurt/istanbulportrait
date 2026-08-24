import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ContactSection } from "@/components/contact-section";
import { PageHeroSection } from "@/components/page-hero-section";
import { SchemaInjector } from "@/components/schema-injector";
import { pagesContentService } from "@/lib/pages-content-service";
import {
  buildContactPageSchema,
  generateSeoDescription,
  getBaseUrl,
} from "@/lib/seo-utils";

export async function ContactPageContent({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const dbPage = await pagesContentService.getPageBySlug("contact");
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "";
  const dynamicSubtitle =
    dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";

  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();

  const contactSchema = buildContactPageSchema({
    name: dynamicTitle,
    description: generateSeoDescription(dynamicSubtitle),
    url: `${getBaseUrl()}/${locale}/${slug}`,
  });

  return (
    <div>
      <SchemaInjector schema={contactSchema} />

      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />
      <div className="section-contain-auto">
        <ContactSection settings={settings} />
      </div>
    </div>
  );
}
