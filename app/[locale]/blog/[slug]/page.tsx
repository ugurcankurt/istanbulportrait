import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllPublishedSlugs,
  getBlogPostBySlug,
} from "@/lib/blog/blog-service";
import type { Locale } from "@/types/blog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatBlogDate } from "@/lib/blog/blog-utils";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { createSchemaConfig, MultipleJsonLd } from "@/lib/structured-data";
import { SEO_CONFIG } from "@/lib/seo-config";
import { getTranslations } from "next-intl/server";

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
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

  return {
    title: post.translation.title,
    description: post.translation.meta_description || post.translation.excerpt || "",
    keywords: post.meta_keywords,
    openGraph: {
      type: "article",
      title: post.translation.title,
      description: post.translation.meta_description || post.translation.excerpt || "",
      publishedTime: post.published_at!,
      modifiedTime: post.updated_at,
      images: post.featured_image ? [post.featured_image] : [],
    },
    alternates: {
      languages: {
        en: `/en/blog/${slug}`,
        ar: `/ar/blog/${slug}`,
        ru: `/ru/blog/${slug}`,
        es: `/es/blog/${slug}`,
      },
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

  // Generate Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.translation.title,
    description: post.translation.excerpt || post.translation.meta_description || "",
    image: post.featured_image || `${schemaConfig.baseUrl}${SEO_CONFIG.images.ogImage}`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: SEO_CONFIG.organization.name,
      url: schemaConfig.baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
      logo: {
        "@type": "ImageObject",
        url: `${schemaConfig.baseUrl}${SEO_CONFIG.images.logo}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${schemaConfig.baseUrl}/${locale}/blog/${slug}`,
    },
    keywords: post.meta_keywords?.join(", ") || "",
    articleSection: post.categories?.[0]?.category?.translation?.name || "Photography",
    wordCount: post.translation.content?.split(" ").length || 0,
  };

  return (
    <div>
      {/* JSON-LD Structured Data for Article */}
      <MultipleJsonLd schemas={[articleSchema as any]} />

      <BreadcrumbNav />

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          {post.featured_image && (
            <div className="aspect-video mb-8 rounded-lg overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.translation.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {post.translation.title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <time dateTime={post.published_at!}>
              {formatBlogDate(post.published_at!, locale)}
            </time>
            <span>•</span>
            <span>{t("reading_time", { minutes: post.reading_time_minutes })}</span>
          </div>

          {post.translation.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.translation.excerpt}
            </p>
          )}
        </header>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.translation.content}
          </ReactMarkdown>
        </div>

        {/* Categories & Tags */}
        <footer className="mt-12 pt-8 border-t">
          <div className="grid md:grid-cols-2 gap-6">
            {post.categories && post.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {post.categories.map((cat: any) => (
                    <span
                      key={cat.category.id}
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: cat.category.color + "20",
                        color: cat.category.color,
                      }}
                    >
                      {cat.category.icon && <span className="mr-1">{cat.category.icon}</span>}
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
                  {post.tags.map((tag: any) => (
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
  );
}
