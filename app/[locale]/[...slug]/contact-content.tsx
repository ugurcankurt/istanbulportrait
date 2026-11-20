import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ContactSection } from "@/components/contact-section";
import { PageHeroSection } from "@/components/page-hero-section";
import { SchemaInjector } from "@/components/schema-injector";
import { SeoEditorialSection } from "@/components/seo-editorial-section";
import { pagesContentService } from "@/lib/pages-content-service";
import {
  buildContactPageSchema,
  enrichSeoDescription,
  getBaseUrl,
  normalizeSchemaUrl,
} from "@/lib/seo-utils";

export async function ContactPageContent({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const { settingsService } = await import("@/lib/settings-service");
  const [dbPage, settings, dynamicNavData, tHub] = await Promise.all([
    pagesContentService.getPageBySlug("contact"),
    settingsService.getSettings(),
    pagesContentService.getDynamicCoreNavData(locale),
    getTranslations({ locale, namespace: "seo_hub" }),
  ]);
  const canonicalSegment =
    pagesContentService.getCorePageSegment(dbPage || "contact", locale) || slug;
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "";
  const dynamicSubtitle =
    dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";
  const publicSettings = settingsService.toPublicSettings(settings, locale);

  const baseUrl = getBaseUrl(settings.app_base_url);

  const contactSchema = buildContactPageSchema({
    name: dynamicTitle,
    description: enrichSeoDescription(dynamicSubtitle, "contact", locale),
    url: normalizeSchemaUrl(`${baseUrl}/${locale}/${canonicalSegment}`),
  });

  return (
    <div>
      <SchemaInjector schema={contactSchema} />

      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />
      <div className="section-contain-auto">
        <ContactSection settings={publicSettings} />
      </div>
      <SeoEditorialSection
        id="booking-inquiry-guide"
        title={tHub("contact.title")}
        subtitle={tHub("contact.subtitle")}
        items={[
          {
            title: tHub("contact.item1_title"),
            description: tHub("contact.item1_desc"),
          },
          {
            title: tHub("contact.item2_title"),
            description: tHub("contact.item2_desc"),
          },
          {
            title: tHub("contact.item3_title"),
            description: tHub("contact.item3_desc"),
          },
        ]}
        links={[
          {
            href: `/${locale}/${dynamicNavData.packages?.path || "packages"}`,
            label: tHub("contact.link_packages"),
          },
          {
            href: `/${locale}/${dynamicNavData.locations?.path || "locations"}`,
            label: tHub("contact.link_locations"),
          },
          {
            href: `/${locale}/${dynamicNavData.about?.path || "about"}`,
            label: tHub("contact.link_about"),
          },
        ]}
      />
    </div>
  );
}
