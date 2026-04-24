import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { HeroClientWrapper } from "@/components/hero-client-wrapper";
import type { DiscountDB } from "@/lib/discount-service";

export async function HeroSection({
  title,
  subtitle,
  backgroundImage,
  activeDiscount,
}: {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  activeDiscount?: DiscountDB | null;
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
            quality={70}
            sizes="100vw"
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA3gAA//9k="
          />
        )}
        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 mb-[5vh] mt-[5vh] sm:mb-[10vh] sm:mt-0 flex lg:justify-start">
        <div className="text-left text-white w-full max-w-6xl">
          <HeroClientWrapper
            packagesButtonText={tui("packages_button")}
            checkLocationsButtonText={tui("check_locations")}
            activeDiscount={activeDiscount}
          >
            {/* Main Title - Server Rendered for LCP */}
            <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-6xl font-bold mb-4 leading-[1.1] tracking-tight drop-shadow-lg text-white">
              {title}
            </h1>

            {/* Subtitle - Server Rendered */}
            <p className="text-lg sm:text-xl md:text-2xl mb-4 text-white/90 leading-[1.3] tracking-tight font-light drop-shadow-md">
              {subtitle}
            </p>
          </HeroClientWrapper>
        </div>
      </div>
    </section>
  );
}
