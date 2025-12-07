"use client";

import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, routing } from "@/i18n/routing";
import { SEO_CONFIG } from "@/lib/seo-config";
import {
  type BreadcrumbData,
  createSchemaConfig,
  generateBreadcrumbListSchema,
  JsonLd,
} from "@/lib/structured-data";

interface BreadcrumbNavProps {
  className?: string;
}

export function BreadcrumbNav({ className }: BreadcrumbNavProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("breadcrumb");

  // Remove locale from pathname and decode URL-encoded characters
  let pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";
  try {
    pathWithoutLocale = decodeURIComponent(pathWithoutLocale);
  } catch (error) {
    console.warn("Failed to decode URL path:", pathWithoutLocale);
  }

  // Create reverse mapping from localized paths to translation keys
  const createPathToKeyMapping = () => {
    const pathToKey: Record<string, string> = {};
    const pathnames = routing.pathnames as Record<string, any>;

    Object.entries(pathnames).forEach(([key, value]) => {
      if (typeof value === "object" && value[locale as keyof typeof value]) {
        const localizedPath = value[locale as keyof typeof value];
        // Handle both /path and path formats
        const cleanPath = localizedPath.startsWith("/")
          ? localizedPath.slice(1)
          : localizedPath;
        pathToKey[cleanPath] = key.startsWith("/") ? key.slice(1) : key;
      } else if (typeof value === "string") {
        const cleanPath = value.startsWith("/") ? value.slice(1) : value;
        pathToKey[cleanPath] = key.startsWith("/") ? key.slice(1) : key;
      }
    });

    return pathToKey;
  };

  const pathToKeyMapping = createPathToKeyMapping();

  // Helper function to get known translations
  const getKnownTranslation = (key: string): string | null => {
    const knownKeys = [
      "about",
      "packages",
      "contact",
      "checkout",
      "privacy",
      "locations",
    ];
    if (knownKeys.includes(key)) {
      try {
        return t(key as any);
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  // Helper function to format unknown segments
  const formatSegment = (segment: string): string => {
    // For non-ASCII characters, try to keep them as-is but clean up
    if (/[^\x00-\x7F]/.test(segment)) {
      // Contains non-ASCII characters (Cyrillic, Arabic, etc.)
      return segment;
    }
    // For ASCII, capitalize first letter
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Generate breadcrumb items based on path
  const generateBreadcrumbs = () => {
    const items: Array<{
      label: string;
      href?: string;
      isHome?: boolean;
      isLast?: boolean;
    }> = [];

    // Always start with home
    items.push({
      label: t("home"),
      href: "/",
      isHome: true,
    });

    // Handle different routes
    if (pathWithoutLocale !== "/") {
      const segments = pathWithoutLocale.split("/").filter(Boolean);

      segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1;
        let label = "";
        const href = `/${segments.slice(0, index + 1).join("/")}`;

        // First try to find translation key from path mapping
        const translationKey = pathToKeyMapping[segment];

        if (translationKey) {
          // Use the mapped translation key
          try {
            label = t(translationKey as any);
          } catch (error) {
            // Fallback to known translations if specific key fails
            label = getKnownTranslation(translationKey) || segment;
          }
        } else {
          // Fallback to known translations or formatted segment
          label = getKnownTranslation(segment) || formatSegment(segment);
        }

        items.push({
          label,
          href: isLast ? undefined : href,
          isLast,
        });
      });
    }

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on home page
  if (pathWithoutLocale === "/") {
    return null;
  }

  // Generate structured data for breadcrumbs
  const schemaConfig = createSchemaConfig(locale);
  const breadcrumbsData: BreadcrumbData[] = breadcrumbs.map((item, index) => {
    const path = item.href || pathWithoutLocale;
    // Ensure locale is included for correct SEO indexing (e.g. /en/about)
    const url = item.isHome
      ? `${SEO_CONFIG.site.url}/${locale}`
      : `${SEO_CONFIG.site.url}/${locale}${path}`;

    return {
      name: item.label,
      url: url,
      position: index + 1,
    };
  });

  const breadcrumbSchema = generateBreadcrumbListSchema(
    breadcrumbsData,
    schemaConfig,
  );

  return (
    <>
      {/* JSON-LD Structured Data for Breadcrumbs */}
      <JsonLd data={breadcrumbSchema} />

      <div className={`bg-muted/30 border-b ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb className="py-3 sm:py-4">
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                  <BreadcrumbItem>
                    {item.isLast ? (
                      <BreadcrumbPage className="flex items-center gap-2">
                        {item.isHome && <Home className="h-4 w-4" />}
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={item.href! as any}
                          className="flex items-center gap-2"
                        >
                          {item.isHome && <Home className="h-4 w-4" />}
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </>
  );
}
