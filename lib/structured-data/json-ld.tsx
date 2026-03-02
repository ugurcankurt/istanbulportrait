/**
 * JSON-LD Structured Data Components for Istanbul Portrait
 * Type-safe implementation using schema-dts
 */

import type { Thing, WithContext } from "schema-dts";

interface JsonLdProps {
  data: WithContext<Thing>;
}

/**
 * Server-side JSON-LD component for structured data
 * Renders JSON-LD script tag with XSS protection
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0)
          .replace(/</g, "\\u003c")
          .replace(/>/g, "\\u003e")
          .replace(/&/g, "\\u0026"),
      }}
    />
  );
}

/**
 * Multiple JSON-LD schemas component
 * Useful when multiple schema types needed on same page
 */
export function MultipleJsonLd({ schemas }: { schemas: WithContext<Thing>[] }) {
  return (
    <>
      {schemas.map((schema, index) => (
        <JsonLd key={index} data={schema} />
      ))}
    </>
  );
}
