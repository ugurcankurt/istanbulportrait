import { getLocale, getTranslations } from "next-intl/server";
import { NotFoundContent } from "@/components/not-found-content";
import { pagesContentService } from "@/lib/pages-content-service";
import { settingsService } from "@/lib/settings-service";

export default async function LocaleNotFound() {
  const locale = await getLocale().catch(() => "en");
  const [t, settings, dynamicNav] = await Promise.all([
    getTranslations({ locale, namespace: "notfound" }),
    settingsService.getSettings().catch(() => null),
    pagesContentService.getDynamicCoreNavData(locale).catch(() => ({})),
  ]);

  const packagesPath =
    (dynamicNav as Record<string, { path: string }>)?.packages?.path ||
    "packages";

  return (
    <NotFoundContent
      locale={locale}
      title={t("title")}
      subtitle={t("subtitle")}
      description={t("description")}
      homeButton={t("homeButton")}
      packagesButton={t("packagesButton")}
      goBack={t("goBack")}
      settings={settings}
      packagesHref={`/${locale}/${packagesPath}`}
    />
  );
}
