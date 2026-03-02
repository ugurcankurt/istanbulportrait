import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { BlogAuthor } from "@/components/blog-author";
import { BlogSummary } from "@/components/blog-summary";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  getAllPublishedSlugs,
  getBlogPostBySlug,
} from "@/lib/blog/blog-service";
import { formatBlogDate } from "@/lib/blog/blog-utils";
import { getBlogPostLocalizedPaths } from "@/lib/localized-url";
import { SEO_CONFIG } from "@/lib/seo-config";
import { createSchemaConfig, MultipleJsonLd } from "@/lib/structured-data";
import type { Locale } from "@/types/blog";

// Force dynamic rendering to avoid build-time Supabase issues
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Failed to fetch blog slugs during build:", error);
    // Return empty array - pages will be generated on-demand at runtime
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = await getBlogPostBySlug(slug, locale);

  if (!post || post.status !== "published") {
    return {
      title: "Post Not Found",
    };
  }

  const paths = getBlogPostLocalizedPaths(slug);

  return {
    title: post.translation.title,
    description:
      post.translation.meta_description || post.translation.excerpt || "",
    keywords: post.meta_keywords,
    openGraph: {
      type: "article",
      title: post.translation.title,
      description:
        post.translation.meta_description || post.translation.excerpt || "",
      publishedTime: post.published_at || post.created_at,

      modifiedTime: post.updated_at,
      images: post.featured_image ? [post.featured_image] : [],
    },
    alternates: {
      canonical: paths.canonical(locale),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug, locale } = await params;
  const post = await getBlogPostBySlug(slug, locale);
  const t = await getTranslations({ locale, namespace: "blog" });

  if (!post || post.status !== "published") {
    notFound();
  }

  // Create schema configuration
  const schemaConfig = createSchemaConfig(locale);

  // Generate AI-optimized Article schema with SpeakableSpecification
  const articleSchema = {
    "@context": "https://schema.org" as const,
    "@type": "BlogPosting" as const,
    "@id": `${schemaConfig.baseUrl}/${locale}/blog/${slug}#article`,
    headline: post.translation.title,
    description:
      post.translation.excerpt || post.translation.meta_description || "",
    image:
      post.featured_image ||
      `${schemaConfig.baseUrl}${SEO_CONFIG.images.ogImage}`,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person" as const,
      name: SEO_CONFIG.person.name,
      url: `${schemaConfig.baseUrl}/${locale}/about`,
      image: SEO_CONFIG.person.image,
      jobTitle: SEO_CONFIG.person.jobTitle,
      sameAs: SEO_CONFIG.organization.sameAs,
    },
    publisher: {
      "@type": "Organization" as const,
      "@id": `${schemaConfig.baseUrl}/#organization`,
      name: SEO_CONFIG.organization.name,
      logo: {
        "@type": "ImageObject" as const,
        url: SEO_CONFIG.organization.logo,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage" as const,
      "@id": `${schemaConfig.baseUrl}/${locale}/blog/${slug}`,
    },
    // AI Overview & Voice Search: SpeakableSpecification
    speakable: {
      "@type": "SpeakableSpecification" as const,
      cssSelector: [
        "article h1",
        "article h2",
        ".blog-summary p",
        "article > div.prose > p:first-of-type",
      ],
    },
    keywords: post.meta_keywords?.join(", ") || "",
    articleSection:
      post.categories && post.categories.length > 0
        ? post.categories[0].category.translation?.name || "Photography"
        : "Photography",
    wordCount: post.translation.content?.split(" ").length || 0,
    timeRequired: `PT${post.reading_time_minutes}M`,
    inLanguage: locale,
    // About entity for AI context
    about: {
      "@type": "Thing" as const,
      name: "Istanbul Photography",
    },
  };

  return (
    <div>
      {/* JSON-LD Structured Data for Article */}
      <MultipleJsonLd schemas={[articleSchema]} />

      <BreadcrumbNav />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <article className="mx-auto">
          {/* Header */}
          <header className="mb-8">
            {post.featured_image && (
              <AspectRatio
                ratio={16 / 9}
                className="mb-8 rounded-lg overflow-hidden"
              >
                <Image
                  src={post.featured_image}
                  alt={post.translation.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="100vw"
                />
              </AspectRatio>
            )}

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {post.translation.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              <time dateTime={post.published_at || post.created_at}>
                {formatBlogDate(post.published_at || post.created_at, locale)}
              </time>
              <span>•</span>
              <span>
                {t("reading_time", { minutes: post.reading_time_minutes })}
              </span>
            </div>

            {post.translation.excerpt && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {post.translation.excerpt}
              </p>
            )}
          </header>

          {/* AI Summary / Key Takeaways */}
          {post.translation.excerpt && (
            <BlogSummary summary={post.translation.excerpt} />
          )}

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {post.translation.content}
            </ReactMarkdown>
          </div>

          {/* Author Bio */}
          <BlogAuthor />

          {/* Categories & Tags */}
          <footer className="mt-12 pt-8 border-t">
            <div className="grid md:grid-cols-2 gap-6">
              {post.categories && post.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((cat) => (
                      <span
                        key={cat.category.id}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${cat.category.color}20`,
                          color: cat.category.color,
                        }}
                      >
                        {cat.category.icon && (
                          <span className="mr-1">{cat.category.icon}</span>
                        )}
                        {cat.category.translation?.name || cat.category.slug}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.tag.id}
                        className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
                      >
                        #{tag.tag.translation?.name || tag.tag.slug}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}
