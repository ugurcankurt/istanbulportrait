import { getTranslations } from "next-intl/server";
import { PageHeroSection } from "@/components/page-hero-section";
import { AboutSection } from "@/components/about-section";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";

import { pagesContentService } from "@/lib/pages-content-service";
import { settingsService } from "@/lib/settings-service";
import { SchemaInjector } from "@/components/schema-injector";
import { buildAboutPageSchema, buildOrganizationSchema, generateSeoDescription, getBaseUrl } from "@/lib/seo-utils";



export async function AboutPageContent({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;






  const dbPage = await pagesContentService.getPageBySlug("about");
  const settings = await settingsService.getSettings();

  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "";
  const dynamicSubtitle = dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";

  const tAboutHighlights = await getTranslations({
    locale,
    namespace: "about_highlights",
  });
  const tAboutCta = await getTranslations({
    locale,
    namespace: "about_cta",
  });

  const organizationSchema = buildOrganizationSchema(settings);
  const aboutSchema = buildAboutPageSchema({
    name: dynamicTitle,
    description: generateSeoDescription(dynamicSubtitle),
    url: `${getBaseUrl()}/${locale}/about`,
    organizationSchema: organizationSchema
  });

  return (
    <div>
      <SchemaInjector schema={aboutSchema} />


      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <div className="section-contain-auto">
        <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />
      </div>

      <div className="section-contain-auto">
        <AboutSection
          dbPage={dbPage as any}
          locale={locale}
          founderImageUrl={settings.founder_image_url}
          highlightsHeader={
            <h2 key="highlights-header" className="text-3xl sm:text-4xl lg:text-5xl font-serif leading-tight text-center mb-8 sm:mb-10 lg:mb-12">
              {tAboutHighlights("title")}
            </h2>
          }
          ctaHeader={
            <div key="cta-header">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif leading-tight mb-4 sm:mb-6">
                {tAboutCta("title")}
              </h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base lg:text-lg px-2">
                {tAboutCta("description")}
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}
