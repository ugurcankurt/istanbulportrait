import { getTranslations } from "next-intl/server";
import { Star } from "lucide-react";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/hero-section";
import { HomeGalleryWrapper } from "@/components/home-gallery-wrapper";

// Below-the-fold components loaded dynamically to improve performance
const PackagesSection = dynamic(() => import("@/components/packages-section").then(mod => mod.PackagesSection));
const InstagramFeed = dynamic(() => import("@/components/instagram-feed").then(mod => mod.InstagramFeed));
const FAQSection = dynamic(() => import("@/components/faq-section").then(mod => mod.FAQSection));
const ReviewsSection = dynamic(() => import("@/components/reviews").then(mod => mod.ReviewsSection));


import { pagesContentService } from "@/lib/pages-content-service";
import { packagesService } from "@/lib/packages-service";
import { discountService } from "@/lib/discount-service";
import { reviewsService } from "@/lib/reviews-service";
import { Metadata } from "next";
import { generateSeoDescription, generateSeoTitle, constructOpenGraph, buildFAQSchema } from "@/lib/seo-utils";
import { SchemaInjector } from "@/components/schema-injector";
import { settingsService } from "@/lib/settings-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const allPages = await pagesContentService.getAllPages();
  const heroPage = allPages.find(p => p.slug === "home-hero");
  const { settingsService } = await import("@/lib/settings-service");
  const settings = await settingsService.getSettings();
  
  const title = generateSeoTitle(heroPage?.title?.[locale] || heroPage?.title?.en, locale, settings.site_name || "");
  const rawDesc = heroPage?.subtitle?.[locale] || heroPage?.subtitle?.en || "";
  const desc = generateSeoDescription(rawDesc) || "";
  const ogImage = heroPage?.cover_image || settings.default_og_image_url || "";

  return {
    title: { absolute: title },
    description: desc,
    openGraph: constructOpenGraph(title, desc, ogImage, settings.site_name || title, locale),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;


  const tReviews = await getTranslations({ locale, namespace: "reviews" });
  const tUi = await getTranslations({ locale, namespace: "ui" });
  const tGallery = await getTranslations({ locale, namespace: "gallery" });
  const tPackages = await getTranslations({ locale, namespace: "packages" });
  const tFaq = await getTranslations({ locale, namespace: "faq" });

  // Fetch aggregate rating and reviews for UI display
  const aggregateRating = await reviewsService.getAggregateRating();
  const reviews = await reviewsService.fetchGoogleReviews();

  // Fetch dynamic packages from Supabase
  const activePackages = await packagesService.getActivePackages();

  // Fetch Site Settings from Supabase
  const settings = await settingsService.getSettings();

  // Fetch active discount campaign
  const activeDiscount = await discountService.getActiveDiscount();

  // Fetch all pages data for dynamic Home Pages sections
  const allPages = await pagesContentService.getAllPages();
  const pageMap = new Map(allPages.map(p => [p.slug, p]));

  const getDynamicTitle = (slug: string, fallback: string) => {
    const page = pageMap.get(slug);
    if (!page || !page.is_active) return fallback;
    return page.title?.[locale] || page.title?.en || fallback;
  };

  const getDynamicSubtitle = (slug: string, fallback: string) => {
    const page = pageMap.get(slug);
    if (!page || !page.is_active) return fallback;
    return page.subtitle?.[locale] || page.subtitle?.en || fallback;
  };

  const getDynamicImage = (slug: string, fallback?: string) => {
    const page = pageMap.get(slug);
    if (!page || !page.is_active || !page.cover_image) return fallback;
    return page.cover_image;
  };

  const getDynamicFaqs = () => {
    const page = pageMap.get("home-faq");
    if (!page || !page.is_active || !page.content?.faqs) return null;
    
    // Transform faqs array focusing on current locale
    return page.content.faqs.map((faq: any, index: number) => ({
      id: `dynamic-faq-${index}`,
      question: faq.question?.[locale] || faq.question?.en || "",
      answer: faq.answer?.[locale] || faq.answer?.en || "",
      keywords: [] 
    })).filter((f: any) => f.question && f.answer);
  };



  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating
              ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
              : "fill-gray-300 text-gray-300"
              }`}
          />
        ))}
      </div>
    );
  };

  const dynamicFaqs = getDynamicFaqs();

  return (
    <>
      <SchemaInjector schema={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: settings.site_name || "Website",
        url: `https://360istanbul.com.tr/${locale}`,
        potentialAction: {
          "@type": "SearchAction",
          target: `https://360istanbul.com.tr/${locale}/packages?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }} />

      {dynamicFaqs && dynamicFaqs.length > 0 && (
        <SchemaInjector schema={buildFAQSchema(dynamicFaqs)} />
      )}

      <div className="overflow-hidden">
        <HeroSection
          title={getDynamicTitle("home-hero", "")}
          subtitle={getDynamicSubtitle("home-hero", "")}
          backgroundImage={getDynamicImage("home-hero", undefined)}
        />

        <div className="section-contain-auto">
          <HomeGalleryWrapper
            locale={locale}
            packages={activePackages}
            header={
              <div key="gallery-header" className="text-left mb-4 sm:mb-4 lg:mb-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-2 sm:mb-2">
                  {getDynamicTitle("home-portfolio", tGallery("title"))}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-5xl">
                  {getDynamicSubtitle("home-portfolio", tGallery("subtitle"))}
                </p>
              </div>
            }
          />
        </div>

        <div className="section-contain-auto">
          <PackagesSection
            aggregateRating={aggregateRating}
            dbPackages={activePackages}
            activeDiscount={activeDiscount}
            header={
              <div key="packages-header" className="text-left mb-4 sm:mb-4 lg:mb-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-2 sm:mb-2">
                  {getDynamicTitle("home-packages", tPackages("title"))}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-6xl">
                  {getDynamicSubtitle("home-packages", tPackages("subtitle"))}
                </p>
              </div>
            }
          />
        </div>

        <div className="section-contain-auto">
          <InstagramFeed
            instagramUrl={settings.instagram_url}
            header={
              <div key="instagram-header" className="text-left mb-4 sm:mb-4 lg:mb-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-2 sm:mb-2">
                  {getDynamicTitle("home-instagram", tUi("instagram_feed.title"))}
                </h2>
                <a
                  href={`https://instagram.com/${(settings.instagram_url?.split('/').pop() || '').trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-5xl"
                >
                  {getDynamicSubtitle("home-instagram", settings.instagram_url ? `@${settings.instagram_url.split('/').pop()}` : "")}
                </a>
              </div>
            }
          />
        </div>

        <div className="section-contain-auto">
          <FAQSection
            dynamicFaqs={getDynamicFaqs()}
            header={
              <div key="faq-header" className="text-left mb-4 sm:mb-4 lg:mb-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-2 sm:mb-2">
                  {getDynamicTitle("home-faq", tFaq("title"))}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-5xl">
                  {getDynamicSubtitle("home-faq", tFaq("subtitle"))}
                </p>
              </div>
            }
          />
        </div>

        <div className="section-contain-auto">
          <ReviewsSection
            locale={locale}
            header={
              <div key="reviews-header" className="text-left mb-4 sm:mb-4 lg:mb-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-2 sm:mb-2">
                  {getDynamicTitle("home-reviews", tReviews("title"))}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-5xl">
                  {getDynamicSubtitle("home-reviews", tReviews("subtitle"))}
                </p>
              </div>
            }
          />
        </div>
      </div>
    </>
  );
}
