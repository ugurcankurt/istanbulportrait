import Script from "next/script";

interface SchemaInjectorProps {
  schema: any;
}

/**
 * Safely injects structured data JSON-LD into the page for search engines.
 * This is totally invisible to the user but critical for SEO.
 */
export function SchemaInjector({ schema }: SchemaInjectorProps) {
  if (!schema) return null;

  return (
    <Script
      id="schema-jsonld"
      type="application/ld+json"
      strategy="beforeInteractive" // Ensure it's available early
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
