import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { CookieTable } from "@/components/cookie-table";
import { PageHeroSection } from "@/components/page-hero-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pagesContentService } from "@/lib/pages-content-service";



export async function PrivacyPageContent({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const dbPage = await pagesContentService.getPageBySlug("privacy");
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "Privacy Policy";
  const dynamicSubtitle = dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";

  const sections = dbPage?.content?.sections || [];

  return (
    <div>
      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <div className="section-contain-auto">
        <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 max-w-4xl">

        <div className="space-y-6">
          {sections.map((section: any, idx: number) => {
            const secTitle = section.title?.[locale] || section.title?.en || "";
            const secDesc = section.description?.[locale] || section.description?.en || "";
            const secItemsRaw = section.items?.[locale] || section.items?.en || "";
            const secItems = secItemsRaw
              .split("\n")
              .map((item: string) => item.trim())
              .filter(Boolean);

            const isCookie = secTitle.toLowerCase().includes("cookie") || secTitle.toLowerCase().includes("çerez") || secTitle.toLowerCase().includes("kuki");

            if (!secTitle && !secDesc && secItems.length === 0) return null;

            return (
              <Card key={idx}>
                {secTitle && (
                  <CardHeader>
                    <CardTitle>{secTitle}</CardTitle>
                  </CardHeader>
                )}
                <CardContent className="space-y-4">
                  {secDesc && (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {secDesc}
                    </p>
                  )}

                  {secItems.length > 0 && (
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      {secItems.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {isCookie && (
                    <div className="pt-4 space-y-4">
                      <CookieTable />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {sections.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
              <p>Privacy Policy configuration is pending.</p>
              <p className="text-sm">Administrators can configure sections in Settings {'->'} Pages {'->'} Privacy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
