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
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/70" />
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
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-normal mb-6 leading-[1.1] tracking-tight drop-shadow-2xl text-white">
              {title}
            </h1>

            {/* Subtitle - Server Rendered */}
            <p className="text-lg md:text-xl lg:text-2xl mb-8 text-white/90 leading-relaxed font-light drop-shadow-md max-w-2xl">
              {subtitle}
            </p>
          </HeroClientWrapper>
        </div>
      </div>
    </section>
  );
}
