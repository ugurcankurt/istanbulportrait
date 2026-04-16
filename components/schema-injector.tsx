import Script from "next/script";
import { useId } from "react";

interface SchemaInjectorProps {
  schema: any;
  id?: string;
}

/**
 * Safely injects structured data JSON-LD into the page for search engines.
 * This is totally invisible to the user but critical for SEO.
 */
export function SchemaInjector({ schema, id }: SchemaInjectorProps) {
  const generatedId = useId();
  if (!schema) return null;

  return (
    <Script
      id={id || `schema-jsonld-${generatedId}`}
      type="application/ld+json"
      strategy="beforeInteractive" // Ensure it's available early
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
