import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { CookieTable } from "@/components/cookie-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/privacy", baseUrl);

  return {
    title: t("seo.title"),
    description: t("seo.description"),
    alternates: {
      canonical: paths.canonical(locale),
    },
  };
}

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  return (
    <div>
      <BreadcrumbNav />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-center">{t("subtitle")}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("information_collection.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t("information_collection.description")}
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>{t("information_collection.items.personal")}</li>
                <li>{t("information_collection.items.contact")}</li>
                <li>{t("information_collection.items.booking")}</li>
                <li>{t("information_collection.items.payment")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("cookies.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                {t("cookies.description")}
              </p>

              {/* Cookie Table */}
              <CookieTable />

              {/* Consent Information */}
              <div className="space-y-3 pt-4 border-t">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">
                    {t("cookies.expiration_note")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("cookies.withdrawal_note")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("data_use.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>{t("data_use.items.booking")}</li>
                <li>{t("data_use.items.communication")}</li>
                <li>{t("data_use.items.improvement")}</li>
                <li>{t("data_use.items.marketing")}</li>
                <li>{t("data_use.items.legal")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("your_rights.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>{t("your_rights.items.access")}</li>
                <li>{t("your_rights.items.rectification")}</li>
                <li>{t("your_rights.items.erasure")}</li>
                <li>{t("your_rights.items.portability")}</li>
                <li>{t("your_rights.items.objection")}</li>
              </ul>
            </CardContent>
          </Card>

          <Card id="image-license">
            <CardHeader>
              <CardTitle>{t("image_license.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{t("image_license.description")}</p>
                <p>{t("image_license.rights")}</p>
                <p>{t("image_license.usage")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("contact.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{t("contact.description")}</p>
                <p>
                  <strong>{t("contact.email_label")}</strong>{" "}
                  info@istanbulportrait.com
                </p>
                <p>
                  <strong>{t("contact.updated_label")}</strong>{" "}
                  {t("contact.updated_date")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
