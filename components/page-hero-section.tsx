export function PageHeroSection({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="py-4 sm:py-6 lg:py-8 bg-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-start mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            {title}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl max-w-3xl text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
