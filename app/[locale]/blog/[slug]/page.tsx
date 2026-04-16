
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
  getBlogPostByIdWithAllTranslations,
} from "@/lib/blog/blog-service";
import { formatBlogDate } from "@/lib/blog/blog-utils";

import { settingsService } from "@/lib/settings-service";
import type { Locale } from "@/types/blog";
import { Metadata } from "next";
import { generateSeoDescription, generateSeoTitle, constructOpenGraph, buildArticleSchema } from "@/lib/seo-utils";
import { SchemaInjector } from "@/components/schema-injector";

// Force dynamic rendering to avoid build-time Supabase issues
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const { getBlogPostBySlug, getBlogPostByIdWithAllTranslations } = await import("@/lib/blog/blog-service");
  const { pagesContentService } = await import("@/lib/pages-content-service");
  const post = await getBlogPostBySlug(slug, locale);
  const settings = await settingsService.getSettings();
  const fallbackTitle = settings.site_name || "";

  if (!post || post.status !== "published") {
    return { title: "Blog Post Not Found" };
  }

  const title = generateSeoTitle(post.translation.title, locale, fallbackTitle);
  const desc = generateSeoDescription(post.translation.excerpt || post.translation.content);
  const ogImage = post.featured_image || settings.default_og_image_url || "";

  const { routing } = await import("@/i18n/routing");
  const { getBaseUrl } = await import("@/lib/seo-utils");
  const { generateNativeSlug } = await import("@/lib/slug-generator");
  const baseUrl = getBaseUrl();
  const allPages = await pagesContentService.getAllPages();
  const blogParent = allPages.find(p => p.slug === "blog");
  
  // Fetch full translation data for correct URL tracking
  const fullPost = await getBlogPostByIdWithAllTranslations(post.id);
  const languages: Record<string, string> = {};

  if (fullPost && fullPost.translations) {
    const enSlug = fullPost.translations["en"]?.slug || slug;

    routing.locales.forEach((loc) => {
      const tSlug = fullPost.translations[loc as Locale]?.slug || enSlug;
      const bTitle = blogParent?.title?.[loc];
      const bSeg = bTitle ? generateNativeSlug(bTitle) : "blog";
      languages[loc] = `${baseUrl}/${loc}/${bSeg}/${tSlug}`;
    });

    const xDefaultSeg = blogParent?.title?.["en"] ? generateNativeSlug(blogParent.title["en"]) : "blog";
    languages["x-default"] = `${baseUrl}/en/${xDefaultSeg}/${enSlug}`;
  }

  const currentSeg = blogParent?.title?.[locale] ? generateNativeSlug(blogParent.title[locale]) : "blog";

  return {
    title,
    description: desc,
    alternates: {
      canonical: `${baseUrl}/${locale}/${currentSeg}/${post.translation.slug || slug}`,
      languages
    },
    openGraph: constructOpenGraph(title, desc, ogImage, fallbackTitle, locale),
  };
}

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



export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}) {
  const { slug, locale } = await params;
  const post = await getBlogPostBySlug(slug, locale);
  const settings = await settingsService.getSettings();
  const t = await getTranslations({ locale, namespace: "blog" });

  if (!post || post.status !== "published") {
    notFound();
  }



  return (
    <div>
      <SchemaInjector schema={buildArticleSchema({
        title: post.translation.title,
        description: generateSeoDescription(post.translation.excerpt || post.translation.content),
        image: post.featured_image || settings.default_og_image_url || "",
        datePublished: post.published_at || post.created_at,
        dateModified: post.updated_at || post.published_at || post.created_at,
        authorName: post.author?.name || settings.founder_name || settings.site_name || "Author",
        publisherName: settings.organization_name || settings.site_name || undefined,
        publisherLogo: settings.logo_url || settings.default_og_image_url || undefined,
      })} />

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
          <BlogAuthor author={post.author} siteSettings={settings} />

          {/* Categories & Tags */}
          <footer className="mt-12 pt-8 border-t section-contain-auto">
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
