interface SchemaInjectorProps {
  schema:
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | null
    | undefined;
  id?: string;
}

/**
 * Safely injects structured data JSON-LD into the page for search engines.
 * Uses native <script> so it is rendered directly in initial server HTML for crawlers.
 */
export function SchemaInjector({ schema, id }: SchemaInjectorProps) {
  if (!schema) return null;

  return (
    <script
      id={id}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data requires raw JSON script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
