import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HeroClientWrapper } from "@/components/hero-client-wrapper";
import type { DiscountDB } from "@/lib/discount-service";

export async function HeroSection({
  title,
  subtitle,
  backgroundImage,
  activeDiscounts,
  packagesHref,
  locationsHref,
}: {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  activeDiscounts?: DiscountDB[] | null;
  packagesHref?: string;
  locationsHref?: string;
} = {}) {
  const tui = await getTranslations("ui");

  return (
    <section className="relative min-h-[55vh] sm:min-h-[80vh] overflow-hidden flex items-center justify-center">
      {/* Background Image with Gradient Overlay - Critical LCP Element */}
      <div className="absolute inset-0 z-0">
        {backgroundImage && (
          <Image
            src={backgroundImage}
            alt={title || "Professional Istanbul photographer"}
            fill
            className="object-cover"
            priority
            fetchPriority="high"
            quality={60}
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA3gAA//9k="
          />
        )}
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16 lg:py-20 flex lg:justify-start">
        <div className="text-left text-white w-full max-w-6xl">
          <HeroClientWrapper
            packagesButtonText={tui("packages_button")}
            checkLocationsButtonText={tui("check_locations")}
            activeDiscounts={activeDiscounts}
            packagesHref={packagesHref}
            locationsHref={locationsHref}
          >
            {/* Main Title - Server Rendered for LCP */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.75rem] font-serif font-normal mb-4 sm:mb-5 leading-[1.12] tracking-[-0.025em] drop-shadow-2xl text-white text-balance max-w-2xl">
              {title}
            </h1>

            {/* Subtitle - Server Rendered */}
            <p className="text-sm sm:text-base md:text-lg mb-6 sm:mb-8 text-white/90 leading-relaxed font-light drop-shadow-md max-w-xl">
              {subtitle}
            </p>
          </HeroClientWrapper>
        </div>
      </div>
    </section>
  );
}
