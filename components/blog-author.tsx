"use client";

import { Instagram } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { SEO_CONFIG } from "@/lib/seo-config";

export function BlogAuthor() {
  const t = useTranslations("blog.author");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-muted/30 rounded-xl p-8 border mt-12">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
        <div className="shrink-0 w-40 md:w-48">
          <AspectRatio ratio={15 / 4}>
            <Image
              src={
                mounted && resolvedTheme === "dark"
                  ? "/istanbulportrait_white_logo.webp"
                  : "/istanbulportrait_dark_logo.webp"
              }
              alt={t("name")}
              fill
              sizes="(max-width: 768px) 160px, 192px"
              className="object-contain"
              suppressHydrationWarning
            />
          </AspectRatio>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-lg font-semibold mb-1">{t("about_title")}</h3>
            <p className="text-xl font-bold text-primary">{t("name")}</p>
          </div>

          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {t("bio")}
          </p>

          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="gap-2">
              <a
                href={SEO_CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="w-4 h-4" />
                {t("follow")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
