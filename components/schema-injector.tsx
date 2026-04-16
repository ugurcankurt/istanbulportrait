import Script from "next/script";

interface SchemaInjectorProps {
  schema: any;
  id?: string;
}

// Server-safe counter for unique schema IDs (works in both SSR and CSR)
let schemaCounter = 0;

/**
 * Safely injects structured data JSON-LD into the page for search engines.
 * This is totally invisible to the user but critical for SEO.
 */
export function SchemaInjector({ schema, id }: SchemaInjectorProps) {
  if (!schema) return null;

  const uniqueId = id || `schema-jsonld-${++schemaCounter}`;

  return (
    <Script
      id={uniqueId}
      type="application/ld+json"
      strategy="beforeInteractive" // Ensure it's available early
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
