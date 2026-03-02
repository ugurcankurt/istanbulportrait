import { getTranslations } from "next-intl/server";
import { NewsletterPopup } from "@/components/newsletter-popup";
import { FAQSectionWithSchema } from "@/components/faq-section-with-schema";
import { GallerySectionWithSchema } from "@/components/gallery-section-with-schema";
import { HeroSection } from "@/components/hero-section";
import { PackagesSection } from "@/components/packages-section";
import { ReviewsSection } from "@/components/reviews";
import { InstagramFeed } from "@/components/instagram-feed";
import { getLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import { reviewsService } from "@/lib/reviews-service";
import {
  createSchemaConfig,
  generateEnhancedLocalBusinessSchema,
  generateOrganizationSchema,
  generatePersonSchema,
  generateReviewsSchema,
  MultipleJsonLd,
  type ReviewData,
} from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo.home" });

  const baseUrl = SEO_CONFIG.site.url;
  const paths = getLocalizedPaths("/", baseUrl);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: paths.canonical(locale),
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tSchema = await getTranslations({ locale, namespace: "seo.schema" });

  // Fetch aggregate rating and reviews for schema
  const aggregateRating = await reviewsService.getAggregateRating();
  const reviews = await reviewsService.fetchGoogleReviews();

  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale, {
    t: tSchema,
    rating: {
      ratingValue: aggregateRating.average,
      reviewCount: aggregateRating.count,
    },
  });

  // Generate review schemas if available
  if (reviews && reviews.length > 0) {
    const reviewsData: ReviewData[] = reviews.map((review) => ({
      author: review.author?.name || "Anonymous",
      rating: review.rating || 5,
      reviewBody: review.text || "",
      datePublished: review.date || new Date().toISOString(),
    }));

    // Add top 5 reviews to schema config
    schemaConfig.reviews = generateReviewsSchema(
      reviewsData.slice(0, 5),
      schemaConfig
    );
  }

  // Generate structured data schemas with AI Search optimization
  const enhancedLocalBusinessSchema =
    generateEnhancedLocalBusinessSchema(schemaConfig);
  const organizationSchema = generateOrganizationSchema(schemaConfig);
  const personSchema = generatePersonSchema(schemaConfig);

  const schemas = [
    enhancedLocalBusinessSchema,
    organizationSchema,
    personSchema,
  ];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <MultipleJsonLd schemas={schemas} />
      <NewsletterPopup />

      <div className="overflow-hidden">
        <HeroSection />
        <GallerySectionWithSchema locale={locale} />
        <PackagesSection />
        <InstagramFeed />
        <FAQSectionWithSchema locale={locale} />
        <ReviewsSection locale={locale} />
      </div>
    </>
  );
}
