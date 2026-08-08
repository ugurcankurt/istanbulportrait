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

  const uniqueId = id || `schema-jsonld-${generatedId}`;

  return (
    <script
      id={uniqueId}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
