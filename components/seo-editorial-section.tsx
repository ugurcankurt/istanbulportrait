import { ArrowRight } from "lucide-react";
import NextLink from "next/link";

export interface SeoEditorialItem {
  title: string;
  description: string;
}

export interface SeoEditorialLink {
  href: string;
  label: string;
}

interface SeoEditorialSectionProps {
  id?: string;
  title: string;
  subtitle: string;
  items: SeoEditorialItem[];
  links?: SeoEditorialLink[];
  className?: string;
}

/**
 * Shared server-rendered editorial content & contextual internal linking section
 * used across core SEO landing pages to strengthen topical depth and internal PageRank flow.
 */
export function SeoEditorialSection({
  id,
  title,
  subtitle,
  items,
  links = [],
  className = "",
}: SeoEditorialSectionProps) {
  return (
    <section
      id={id}
      className={`py-10 sm:py-14 border-t border-border/40 bg-muted/15 section-contain-auto ${className}`.trim()}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border/50 bg-background/70 p-6 shadow-sm"
            >
              <h3 className="text-lg sm:text-xl font-serif font-normal text-foreground tracking-tight mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {links.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/40 flex flex-wrap items-center gap-4 sm:gap-6">
            {links.map((link) => (
              <NextLink
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </NextLink>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
