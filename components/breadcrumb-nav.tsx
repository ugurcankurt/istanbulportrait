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
import Link from "next/link";
import { routing } from "@/i18n/routing";


interface BreadcrumbNavProps {
  className?: string;
  customLastLabel?: string;
}

export function BreadcrumbNav(props: BreadcrumbNavProps) {
  const { className } = props;
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
          // Use the mapped translation key (format it)
          try {
            label = t(translationKey as any);
          } catch {
            label = formatSegment(translationKey);
          }
        } else {
          // Fallback to formatted segment
          label = formatSegment(segment);
        }

        // If this is the last segment and a custom label is provided, overwrite it
        if (isLast && props.customLastLabel) {
          label = props.customLastLabel;
        }

        items.push({
          label,
          href: isLast ? undefined : `/${locale}${href}`,
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



  return (
    <>      <div className={`bg-muted/30 border-b ${className}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb className="py-3 sm:py-4 overflow-hidden">
            <BreadcrumbList className="flex-nowrap overflow-x-auto whitespace-nowrap scrollbar-hide pb-1 -mb-1">
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
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
                          href={item.href || "#"}
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
