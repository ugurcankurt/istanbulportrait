"use client";

import { Instagram, Globe, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import type { BlogAuthor as BlogAuthorType, Locale } from "@/types/blog";
import type { SiteSettings } from "@/lib/settings-service";
import { useParams } from "next/navigation";

interface BlogAuthorProps {
  author?: BlogAuthorType;
  siteSettings?: SiteSettings;
}

export function BlogAuthor({ author, siteSettings }: BlogAuthorProps) {
  const t = useTranslations("blog.author");
  const { locale } = useParams() as { locale: Locale };
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const name = author?.name || siteSettings?.founder_name || t("name");
  const bio = author?.bio?.[locale] || author?.bio?.en || siteSettings?.site_description?.[locale] || siteSettings?.site_description?.en || t("bio");
  const role = author?.role?.[locale] || author?.role?.en || "";
  const avatarUrl = author?.avatar_url || siteSettings?.founder_image_url;

  const fallbackLogo = (mounted && resolvedTheme === "dark" ? siteSettings?.logo_dark_url : siteSettings?.logo_url) || siteSettings?.logo_url;

  const socialLinks = {
    ...author?.social_links,
    instagram: author?.social_links?.instagram || siteSettings?.instagram_url,
    twitter: author?.social_links?.twitter,
    linkedin: author?.social_links?.linkedin,
    website: author?.social_links?.website || siteSettings?.app_base_url,
  };

  return (
    <div className="bg-muted/30 rounded-xl p-8 border mt-12">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-start">
        <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 relative">
          <div className="rounded-full overflow-hidden border-2 border-primary/20 w-full h-full relative bg-muted">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                fill
                sizes="(max-width: 768px) 96px, 128px"
                className="object-cover"
              />
            ) : fallbackLogo ? (
              <Image
                src={fallbackLogo}
                alt={name}
                fill
                sizes="(max-width: 768px) 96px, 128px"
                className="object-contain p-4"
                suppressHydrationWarning
              />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <span className="text-3xl font-bold uppercase text-muted-foreground">{name.charAt(0)}</span>
                </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {t("about_title")}
            </h3>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-bold text-primary">{name}</p>
              {role && (
                <p className="text-sm font-medium text-muted-foreground">
                  {role}
                </p>
              )}
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {bio}
          </p>

          <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
            {socialLinks.instagram && (
              <Button nativeButton={false} render={<a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" />} variant="outline" size="sm" className="gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
              </Button>
            )}
            {socialLinks.twitter && (
              <Button nativeButton={false} render={<a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" />} variant="outline" size="sm" className="gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter
              </Button>
            )}
            {socialLinks.linkedin && (
              <Button nativeButton={false} render={<a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" />} variant="outline" size="sm" className="gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
              </Button>
            )}
            {socialLinks.website && (
              <Button nativeButton={false} render={<a href={socialLinks.website} target="_blank" rel="noopener noreferrer" />} variant="outline" size="sm" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Website
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
