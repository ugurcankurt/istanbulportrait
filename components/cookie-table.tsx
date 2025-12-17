"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function CookieTable() {
  const t = useTranslations("privacy.cookies.table");

  const cookies = [
    // Essential Cookies
    {
      name: "user_consent",
      purpose: t("essential.user_consent.purpose"),
      type: t("types.essential"),
      duration: t("essential.user_consent.duration"),
      provider: t("providers.first_party"),
    },
    // Analytics Cookies - Google Analytics
    {
      name: "_ga",
      purpose: t("analytics.ga.purpose"),
      type: t("types.analytics"),
      duration: t("analytics.ga.duration"),
      provider: t("providers.google"),
    },
    {
      name: "_gid",
      purpose: t("analytics.gid.purpose"),
      type: t("types.analytics"),
      duration: t("analytics.gid.duration"),
      provider: t("providers.google"),
    },
    {
      name: "_gat",
      purpose: t("analytics.gat.purpose"),
      type: t("types.analytics"),
      duration: t("analytics.gat.duration"),
      provider: t("providers.google"),
    },
    // Analytics Cookies - Yandex Metrica
    {
      name: "_ym_uid",
      purpose: t("analytics.ym_uid.purpose"),
      type: t("types.analytics"),
      duration: t("analytics.ym_uid.duration"),
      provider: t("providers.yandex"),
    },
    {
      name: "_ym_d",
      purpose: t("analytics.ym_d.purpose"),
      type: t("types.analytics"),
      duration: t("analytics.ym_d.duration"),
      provider: t("providers.yandex"),
    },
    // Analytics Cookies - Microsoft Clarity
    {
      name: "_clck",
      purpose: t("analytics.clck.purpose"),
      type: t("types.analytics"),
      duration: t("analytics.clck.duration"),
      provider: t("providers.microsoft"),
    },
    {
      name: "_clsk",
      purpose: t("analytics.clsk.purpose"),
      type: t("types.analytics"),
      duration: t("analytics.clsk.duration"),
      provider: t("providers.microsoft"),
    },
    // Marketing Cookies - Facebook Pixel
    {
      name: "_fbp",
      purpose: t("marketing.fbp.purpose"),
      type: t("types.marketing"),
      duration: t("marketing.fbp.duration"),
      provider: t("providers.facebook"),
    },
    {
      name: "_fbc",
      purpose: t("marketing.fbc.purpose"),
      type: t("types.marketing"),
      duration: t("marketing.fbc.duration"),
      provider: t("providers.facebook"),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("title")}</h3>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">
                {t("columns.name")}
              </TableHead>
              <TableHead className="min-w-[200px]">
                {t("columns.purpose")}
              </TableHead>
              <TableHead className="min-w-[100px]">
                {t("columns.type")}
              </TableHead>
              <TableHead className="min-w-[100px]">
                {t("columns.duration")}
              </TableHead>
              <TableHead className="min-w-[120px]">
                {t("columns.provider")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cookies.map((cookie) => (
              <TableRow key={cookie.name}>
                <TableCell className="font-mono text-xs">
                  {cookie.name}
                </TableCell>
                <TableCell className="text-sm">{cookie.purpose}</TableCell>
                <TableCell className="text-sm">{cookie.type}</TableCell>
                <TableCell className="text-sm">{cookie.duration}</TableCell>
                <TableCell className="text-sm">{cookie.provider}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
