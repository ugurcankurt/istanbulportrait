"use client";

import { usePageSchema } from "@/lib/hooks/use-seo";
import {
  StructuredData,
  OrganizationStructuredData,
  PersonStructuredData,
  ServiceStructuredData,
  WebSiteStructuredData,
} from "./structured-data";

/**
 * SEO Layout Component
 * Automatically includes appropriate structured data based on current page
 */

export interface SEOLayoutProps {
  children: React.ReactNode;
  customSchema?: any[];
}

export function SEOLayout({ children, customSchema = [] }: SEOLayoutProps) {
  const {
    pageType,
    schemaData,
    shouldIncludeOrganization,
    shouldIncludePerson,
    shouldIncludeService,
    shouldIncludeWebsite,
  } = usePageSchema();

  return (
    <>
      {/* Base Website Schema (only on homepage) */}
      {shouldIncludeWebsite && <WebSiteStructuredData />}

      {/* Organization Schema (on all pages) */}
      {shouldIncludeOrganization && <OrganizationStructuredData />}

      {/* Person Schema (on about and homepage) */}
      {shouldIncludePerson && <PersonStructuredData />}

      {/* Service Schema (on packages and homepage) */}
      {shouldIncludeService && <ServiceStructuredData />}

      {/* Page-specific Schema */}
      <StructuredData type="webpage" data={schemaData} />

      {/* Breadcrumb Schema (on all pages except homepage) */}
      {pageType !== "homepage" && (
        <StructuredData type="breadcrumb" data={schemaData.breadcrumb} />
      )}

      {/* Custom Schema passed from parent components */}
      {customSchema.map((schema, index) => (
        <StructuredData
          key={`custom-schema-${index}`}
          type="custom"
          data={schema}
        />
      ))}

      {children}
    </>
  );
}

export default SEOLayout;
