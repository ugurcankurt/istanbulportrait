export function PageHeroSection({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-gradient-to-b from-primary/[0.04] via-muted/20 to-background border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-start max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-serif font-normal leading-[1.14] tracking-tight mb-3 sm:mb-4 text-balance">
            {title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-light leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
