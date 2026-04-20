import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { BlogAuthor } from "@/components/blog-author";
import { BlogSummary } from "@/components/blog-summary";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { getBlogPostBySlug, getSalvagedBlogSlug } from "@/lib/blog/blog-service";
import { formatBlogDate } from "@/lib/blog/blog-utils";
import { settingsService } from "@/lib/settings-service";
import type { Locale } from "@/types/blog";
import { generateSeoDescription, buildArticleSchema } from "@/lib/seo-utils";
import { SchemaInjector } from "@/components/schema-injector";

export async function BlogDetailPageContent({
  locale,
  slug,
  parentSlug,
}: {
  locale: string;
  slug: string;
  parentSlug: string;
}) {
  const decodedSlug = decodeURIComponent(slug);
  const post = await getBlogPostBySlug(decodedSlug, locale as Locale);
  const settings = await settingsService.getSettings();
  const t = await getTranslations({ locale, namespace: "blog" });

  if (!post || post.status !== "published") {
    // Attempt to salvage the navigation by checking if the slug belongs to another language
    const salvagedSlug = await getSalvagedBlogSlug(decodedSlug, locale);
    if (salvagedSlug) {
      redirect(`/${locale}/blog/${encodeURIComponent(salvagedSlug)}`);
    }
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
        authorUrls: post.author?.social_links ? Object.values(post.author.social_links).filter(Boolean) as string[] : [settings.instagram_url, settings.facebook_url, settings.youtube_url, settings.tiktok_url].filter(Boolean) as string[],
        publisherName: settings.organization_name || settings.site_name || undefined,
        publisherLogo: settings.logo_url || settings.default_og_image_url || undefined,
        inLanguage: locale,
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
                {formatBlogDate(post.published_at || post.created_at, locale as Locale)}
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
                  <h2 className="text-sm font-semibold mb-3">Categories</h2>
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
                  <h2 className="text-sm font-semibold mb-3">Tags</h2>
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
