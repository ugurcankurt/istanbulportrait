import { ArrowRight, Star } from "lucide-react";
import NextLink from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
export const revalidate = 60;

import dynamic from "next/dynamic";
import { BlogCard } from "@/components/blog-card";
import { HeroSection } from "@/components/hero-section";
import { HomeGalleryWrapper } from "@/components/home-gallery-wrapper";
import { LocationCard } from "@/components/location-card";

// Below-the-fold components loaded dynamically to improve performance
const PackagesSection = dynamic(() =>
  import("@/components/packages-section").then((mod) => mod.PackagesSection),
);
const InstagramFeed = dynamic(() =>
  import("@/components/instagram-feed").then((mod) => mod.InstagramFeed),
);
const FAQSection = dynamic(() =>
  import("@/components/faq-section").then((mod) => mod.FAQSection),
);
const ReviewsSection = dynamic(() =>
  import("@/components/reviews").then((mod) => mod.ReviewsSection),
);
const NewsletterSection = dynamic(() =>
  import("@/components/newsletter-section").then(
    (mod) => mod.NewsletterSection,
  ),
);

import type { Metadata } from "next";
import { SchemaInjector } from "@/components/schema-injector";
import { getPublishedBlogPosts } from "@/lib/blog/blog-service";
import { discountService } from "@/lib/discount-service";
import { locationsService } from "@/lib/locations-service";
import { packagesService } from "@/lib/packages-service";
import { pagesContentService } from "@/lib/pages-content-service";
import { calculateDiscountedPrice } from "@/lib/pricing";
import { reviewsService } from "@/lib/reviews-service";
import {
  buildFAQSchema,
  buildImageGallerySchema,
  buildLocalBusinessSchema,
  constructOpenGraph,
  formatPageTitle,
  generateSeoDescription,
  getBaseUrl,
  optimizeSeoImage,
} from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";
import type { Locale } from "@/types/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { routing } = await import("@/i18n/routing");

  // biome-ignore lint/suspicious/noExplicitAny: Routing locale matching
  if (!routing.locales.includes(locale as any)) {
    return { title: "Not Found" };
  }

  const { settingsService } = await import("@/lib/settings-service");

  const [allPages, settings] = await Promise.all([
    pagesContentService.getAllPages(),
    settingsService.getSettings(),
  ]);

  const homePage = allPages.find((p) => p.slug === "home");
  const heroPage = allPages.find((p) => p.slug === "home-hero");

  // Decouple SEO Title from H1 string. The user can configure the 'home' page slug in the Pages Core panel to manage SEO metadata perfectly.
  const seoSource =
    homePage?.title?.[locale] || homePage?.title?.en ? homePage : heroPage;

  const siteName = settings.site_name || "Istanbul Portrait";
  const rawTitle = seoSource?.title?.[locale] || seoSource?.title?.en;
  const title = formatPageTitle(rawTitle, siteName);
  const rawDesc =
    seoSource?.subtitle?.[locale] ||
    seoSource?.subtitle?.en ||
    settingsService.resolveTranslatable(settings.site_description, locale) ||
    "";
  const desc = generateSeoDescription(rawDesc, 155, locale);
  const ogImage =
    seoSource?.cover_image ||
    heroPage?.cover_image ||
    homePage?.cover_image ||
    settings.default_og_image_url ||
    "";

  const { getBaseUrl } = await import("@/lib/seo-utils");
  const baseUrl = getBaseUrl();
  const languages: Record<string, string> = {};
  routing.locales.forEach((loc) => {
    languages[loc] = `${baseUrl}/${loc}`;
  });
  languages["x-default"] = `${baseUrl}/en`;

  return {
    title: { absolute: title },
    description: desc,
    robots: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages,
    },
    openGraph: constructOpenGraph(title, desc, ogImage, siteName, locale, {
      url: `${baseUrl}/${locale}`,
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: ogImage ? [optimizeSeoImage(ogImage, 1200)] : [],
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Fetch data in parallel to avoid Request Waterfall and reduce TTFB
  const [
    tReviews,
    tUi,
    tGallery,
    tPackages,
    tFaq,
    tHomeSeo,
    aggregateRating,
    reviews,
    activePackages,
    activeLocations,
    recentBlogResult,
    settings,
    activeDiscounts,
    allPages,
  ] = await Promise.all([
    getTranslations({ locale, namespace: "reviews" }),
    getTranslations({ locale, namespace: "ui" }),
    getTranslations({ locale, namespace: "gallery" }),
    getTranslations({ locale, namespace: "packages" }),
    getTranslations({ locale, namespace: "faq" }),
    getTranslations({ locale, namespace: "home_seo" }),
    reviewsService.getAggregateRating(),
    reviewsService.fetchGoogleReviews(locale),
    packagesService.getActivePackages(),
    locationsService.getLocations(),
    getPublishedBlogPosts({
      page: 1,
      limit: 3,
      locale: locale as Locale,
      sort_by: "published_at",
      sort_order: "desc",
    }).catch(() => ({ posts: [] })),
    settingsService.getSettings(),
    discountService.getActiveDiscounts(),
    pagesContentService.getAllPages(),
  ]);

  const recentBlogPosts = recentBlogResult?.posts || [];

  const pageMap = new Map(allPages.map((p) => [p.slug, p]));

  const packagesParent = pageMap.get("packages");
  const packagesParentSlug =
    pagesContentService.getCorePageSegment(
      packagesParent || "packages",
      locale,
    ) || "packages";

  const locationsParent = pageMap.get("locations");
  const locationsParentSlug =
    pagesContentService.getCorePageSegment(
      locationsParent || "locations",
      locale,
    ) || "locations";

  const blogParent = pageMap.get("blog");
  const blogParentSlug =
    pagesContentService.getCorePageSegment(blogParent || "blog", locale) ||
    "blog";

  const aboutParent = pageMap.get("about");
  const aboutParentSlug =
    pagesContentService.getCorePageSegment(aboutParent || "about", locale) ||
    "about";

  const getDynamicTitle = (slug: string, fallback: string) => {
    const page = pageMap.get(slug);
    if (!page?.is_active) return fallback;
    const val = page.title?.[locale] || page.title?.en;
    return val ? val : fallback;
  };

  const getDynamicSubtitle = (slug: string, fallback: string) => {
    const page = pageMap.get(slug);
    if (!page?.is_active) return fallback;
    const val = page.subtitle?.[locale] || page.subtitle?.en;
    return val ? val : fallback;
  };

  const getDynamicImage = (slug: string, fallback?: string) => {
    const page = pageMap.get(slug);
    if (!page?.is_active || !page.cover_image) return fallback;
    return page.cover_image;
  };

  const getDynamicFaqs = () => {
    const page = pageMap.get("home-faq");
    if (!page?.is_active || !page.content?.faqs) return null;

    // Transform faqs array focusing on current locale
    return (
      page.content.faqs
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
        .map((faq: any, index: number) => ({
          id: `dynamic-faq-${index}`,
          question: faq.question?.[locale] || faq.question?.en || "",
          answer: faq.answer?.[locale] || faq.answer?.en || "",
          keywords: [],
        }))
        // biome-ignore lint/suspicious/noExplicitAny: Dynamic data
        .filter((f: any) => f.question && f.answer)
    );
  };

  const _renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                : "fill-gray-300 text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const dynamicFaqs = getDynamicFaqs();

  // Compute active discount percentage once for consistent LocalBusiness priceRange & OfferCatalog pricing
  let activeDiscountPct = 0;
  let priceRangeStr: string | undefined;
  if (activePackages && activePackages.length > 0) {
    const discountedResults = activePackages.map((p) =>
      calculateDiscountedPrice(p.price, activeDiscounts),
    );
    activeDiscountPct = discountedResults.reduce(
      (max, r) => Math.max(max, r?.discountPercentage || 0),
      0,
    );
    const prices = discountedResults
      .map((r, idx) => r?.price || activePackages[idx].price)
      .filter((p) => !Number.isNaN(p) && p > 0);
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      priceRangeStr = `€${minPrice} - €${maxPrice}`;
    }
  }

  // Keep homepage packages 100% semantically focused on Istanbul (non-Istanbul destinations like Cappadocia remain on /packages)
  const istanbulPackages = (activePackages || []).filter(
    (pkg) => !pkg.slug.toLowerCase().includes("cappadocia"),
  );

  // Slim package props passed to Client Component (keep only current locale + en fallback, drop heavy gallery_images/description)
  const slimPackages = istanbulPackages.map((pkg) => ({
    ...pkg,
    title: {
      en: pkg.title?.en || pkg.slug,
      ...(pkg.title?.[locale] ? { [locale]: pkg.title[locale] } : {}),
    },
    description: { en: "" },
    duration: {
      en: pkg.duration?.en || "",
      ...(pkg.duration?.[locale] ? { [locale]: pkg.duration[locale] } : {}),
    },
    features: {
      en: pkg.features?.en || [],
      ...(pkg.features?.[locale] ? { [locale]: pkg.features[locale] } : {}),
    },
    gallery_images: [] as string[],
  }));

  // Slim location props passed to Client LocationCard (keep only current locale + en fallback)
  const slimLocations = (activeLocations || []).slice(0, 8).map((loc) => ({
    ...loc,
    title: {
      en: loc.title?.en || loc.slug,
      ...(loc.title?.[locale] ? { [locale]: loc.title[locale] } : {}),
    },
    description: {
      en: loc.description?.en || "",
      ...(loc.description?.[locale]
        ? { [locale]: loc.description[locale] }
        : {}),
    },
    best_time: {
      en: loc.best_time?.en || "",
      ...(loc.best_time?.[locale] ? { [locale]: loc.best_time[locale] } : {}),
    },
    gallery_images: [] as string[],
    photography_tips: {},
  }));

  return (
    <>
      <SchemaInjector
        schema={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${getBaseUrl()}/#website`,
          name: settings.site_name || "Istanbul Portrait",
          url: `${getBaseUrl()}/${locale}`,
          inLanguage: locale,
          publisher: {
            "@type": "Organization",
            "@id": `${getBaseUrl()}/#organization`,
          },
        }}
      />
      <SchemaInjector
        schema={buildLocalBusinessSchema(
          settings,
          priceRangeStr,
          reviews?.reviews,
          aggregateRating?.average,
          aggregateRating?.count,
          getDynamicImage("home-hero", undefined) ||
            getDynamicImage("home", undefined),
          locale,
          activePackages,
          packagesParentSlug,
          activeDiscountPct,
        )}
      />
      {dynamicFaqs && dynamicFaqs.length > 0 && (
        <SchemaInjector schema={buildFAQSchema(dynamicFaqs)} />
      )}
      {activePackages && activePackages.length > 0 && (
        <SchemaInjector
          schema={buildImageGallerySchema({
            name: `${settings.site_name || "Istanbul Portrait"} — ${getDynamicTitle("home-portfolio", tGallery("title"))}`,
            description: getDynamicSubtitle(
              "home-portfolio",
              tGallery("subtitle"),
            ),
            url: `${getBaseUrl()}/${locale}`,
            creatorName: settings.founder_name || "Uğur Cankurt",
            images: activePackages
              .flatMap((pkg) => {
                const pkgTitle = pkg.title[locale] || pkg.title.en || pkg.slug;
                const list = [];
                if (pkg.cover_image) {
                  list.push({
                    url: pkg.cover_image,
                    caption: pkgTitle,
                  });
                }
                if (pkg.gallery_images && Array.isArray(pkg.gallery_images)) {
                  pkg.gallery_images.slice(0, 2).forEach((src) => {
                    list.push({
                      url: src,
                      caption: pkgTitle,
                    });
                  });
                }
                return list;
              })
              .slice(0, 12),
          })}
        />
      )}

      <div className="overflow-hidden">
        <HeroSection
          title={getDynamicTitle(
            "home-hero",
            tUi("professional_photographer_in_istanbul"),
          )}
          subtitle={getDynamicSubtitle(
            "home-hero",
            tUi("portrait_photography"),
          )}
          backgroundImage={getDynamicImage("home-hero", undefined)}
          activeDiscounts={activeDiscounts}
          packagesHref={`/${packagesParentSlug}`}
          locationsHref={`/${locationsParentSlug}`}
          isChristmas={settings.theme_color === "christmas"}
        />

        <div>
          <PackagesSection
            aggregateRating={aggregateRating}
            dbPackages={slimPackages}
            activeDiscounts={activeDiscounts}
            parentSlug={packagesParentSlug}
            header={
              <div key="packages-header" className="text-left mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
                  {getDynamicTitle("home-packages", tPackages("title"))}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-4xl">
                  {getDynamicSubtitle("home-packages", tPackages("subtitle"))}
                </p>
              </div>
            }
          />
        </div>

        {/* High-E-E-A-T Editorial Process & Query Fan-Out Section (SSR Visible) */}
        <section
          id="how-istanbul-photoshoot-works"
          className="py-10 sm:py-14 border-y border-border/40 bg-muted/15"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div className="text-left max-w-4xl">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
                  {tHomeSeo("editorial_title")}
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground font-light leading-relaxed">
                  {tHomeSeo("editorial_subtitle")}
                </p>
              </div>
              <NextLink
                href={`/${locale}/${aboutParentSlug}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary hover:underline underline-offset-4 shrink-0"
              >
                <span>{tHomeSeo("editorial_about_cta")}</span>
                <ArrowRight className="w-4 h-4" />
              </NextLink>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {[
                {
                  title: tHomeSeo("step1_title"),
                  desc: tHomeSeo("step1_desc"),
                },
                {
                  title: tHomeSeo("step2_title"),
                  desc: tHomeSeo("step2_desc"),
                },
                {
                  title: tHomeSeo("step3_title"),
                  desc: tHomeSeo("step3_desc"),
                },
                {
                  title: tHomeSeo("step4_title"),
                  desc: tHomeSeo("step4_desc"),
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border/50 bg-background/70 p-6 shadow-sm"
                >
                  <h3 className="text-lg sm:text-xl font-serif font-normal text-foreground tracking-tight mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {slimLocations.length > 0 && (
          <section
            id="istanbul-locations"
            className="py-8 sm:py-10 section-contain-auto"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-left mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
                  {tHomeSeo("locations_title")}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-4xl">
                  {tHomeSeo("locations_subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {slimLocations.map((location, index) => (
                  <LocationCard
                    key={location.slug}
                    location={location}
                    index={index}
                    parentSlug={locationsParentSlug}
                    priority={false}
                  />
                ))}
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/40 pt-6">
                <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed max-w-3xl">
                  {tHomeSeo("locations_editorial")}
                </p>
                <NextLink
                  href={`/${locale}/${locationsParentSlug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4 shrink-0"
                >
                  <span>{tHomeSeo("locations_cta")}</span>
                  <ArrowRight className="w-4 h-4" />
                </NextLink>
              </div>
            </div>
          </section>
        )}

        <div className="section-contain-auto">
          <HomeGalleryWrapper
            locale={locale}
            packages={activePackages}
            header={
              <div key="gallery-header" className="text-left mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
                  {getDynamicTitle("home-portfolio", tGallery("title"))}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-4xl">
                  {getDynamicSubtitle("home-portfolio", tGallery("subtitle"))}
                </p>
              </div>
            }
          />
        </div>

        <div className="section-contain-auto">
          <InstagramFeed
            instagramUrl={settings.instagram_url}
            header={
              <div key="instagram-header" className="text-left mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
                  {getDynamicTitle(
                    "home-instagram",
                    tUi("instagram_feed.title"),
                  )}
                </h2>
                <a
                  href={`https://instagram.com/${(settings.instagram_url?.replace(/\/$/, "").split("/").pop() || "").trim()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base sm:text-lg lg:text-xl text-muted-foreground font-light hover:text-primary transition-colors max-w-4xl"
                >
                  {getDynamicSubtitle(
                    "home-instagram",
                    settings.instagram_url
                      ? `@${settings.instagram_url.replace(/\/$/, "").split("/").pop()}`
                      : "",
                  )}
                </a>
              </div>
            }
          />
        </div>

        <div className="section-contain-auto">
          <FAQSection
            dynamicFaqs={dynamicFaqs}
            header={
              <div key="faq-header" className="text-left mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
                  {getDynamicTitle("home-faq", tFaq("title"))}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-4xl">
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
              <div key="reviews-header" className="text-left mb-6 sm:mb-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
                  {getDynamicTitle("home-reviews", tReviews("title"))}
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-4xl">
                  {getDynamicSubtitle("home-reviews", tReviews("subtitle"))}
                </p>
              </div>
            }
          />
        </div>

        {recentBlogPosts.length > 0 && (
          <section
            id="istanbul-guides"
            className="py-8 sm:py-10 section-contain-auto"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
                <div className="text-left">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight mb-2 sm:mb-3">
                    {tHomeSeo("blog_title")}
                  </h2>
                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground font-light leading-relaxed max-w-4xl">
                    {tHomeSeo("blog_subtitle")}
                  </p>
                </div>
                <NextLink
                  href={`/${locale}/${blogParentSlug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4 shrink-0"
                >
                  <span>{tHomeSeo("blog_cta")}</span>
                  <ArrowRight className="w-4 h-4" />
                </NextLink>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentBlogPosts.map((post) => (
                  <BlogCard
                    key={post.id}
                    post={post}
                    locale={locale}
                    parentSegment={blogParentSlug}
                    headingLevel="h3"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <NewsletterSection />
      </div>
    </>
  );
}
