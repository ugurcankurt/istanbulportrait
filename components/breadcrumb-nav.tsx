"use client";

import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { StructuredData } from "@/components/seo/structured-data";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/routing";

interface BreadcrumbNavProps {
  className?: string;
}

export function BreadcrumbNav({ className }: BreadcrumbNavProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("breadcrumb");

  // Remove locale from pathname for processing
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

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

        // Map segments to translations
        switch (segment) {
          case "about":
            label = t("about");
            break;
          case "packages":
            label = t("packages");
            break;
          case "contact":
            label = t("contact");
            break;
          case "checkout":
            label = t("checkout");
            break;
          case "privacy":
            label = t("privacy");
            break;
          default:
            // Capitalize first letter for unknown segments
            label = segment.charAt(0).toUpperCase() + segment.slice(1);
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

  // Generate structured data for breadcrumbs
  const breadcrumbSchemaData = {
    items: breadcrumbs.map((item) => ({
      name: item.label,
      url: item.href ? `/${locale}${item.href}` : undefined,
    })),
  };

  // Don't show breadcrumb on home page
  if (pathWithoutLocale === "/") {
    return null;
  }

  return (
    <>
      <StructuredData type="breadcrumblist" data={breadcrumbSchemaData} />
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
