import Image from "next/image";
import NextLink from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { BlogAuthor } from "@/components/blog-author";
import { BlogCard } from "@/components/blog-card";
import { BlogSummary } from "@/components/blog-summary";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { SchemaInjector } from "@/components/schema-injector";
import { TableOfContents } from "@/components/table-of-contents";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  getBlogPostBySlug,
  getPublishedBlogPosts,
  getSalvagedBlogSlug,
} from "@/lib/blog/blog-service";
import {
  formatBlogDate,
  getLocalizedCategorySlug,
  getLocalizedTagSlug,
} from "@/lib/blog/blog-utils";
import { getBlogTaxonomySegment } from "@/lib/core-page-slugs";
import { pagesContentService } from "@/lib/pages-content-service";
import {
  buildArticleSchema,
  generateSeoDescription,
  getBaseUrl,
  normalizeSchemaUrl,
} from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";
import type { Locale } from "@/types/blog";

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
  const [post, settings, blogPage] = await Promise.all([
    getBlogPostBySlug(decodedSlug, locale as Locale),
    settingsService.getSettings(),
    pagesContentService.getPageBySlug("blog"),
  ]);
  const canonicalParentSlug =
    pagesContentService.getCorePageSegment(blogPage || "blog", locale) ||
    parentSlug;
  const t = await getTranslations({ locale, namespace: "blog" });

  if (post?.status !== "published") {
    // Attempt to salvage the navigation by checking if the slug belongs to another language
    const salvagedSlug = await getSalvagedBlogSlug(decodedSlug, locale);
    if (salvagedSlug && salvagedSlug !== decodedSlug) {
      permanentRedirect(
        `/${locale}/${canonicalParentSlug}/${encodeURIComponent(salvagedSlug)}`,
      );
    }
    notFound();
  }

  // Fetch related posts (latest 3 excluding the current one)
  const { posts: allRecentPosts } = await getPublishedBlogPosts({
    page: 1,
    limit: 4,
    locale: locale as Locale,
    sort_by: "published_at",
    sort_order: "desc",
  });
  const relatedPosts = allRecentPosts
    .filter((p) => p.id !== post.id)
    .slice(0, 3);

  return (
    <div>
      <SchemaInjector
        schema={buildArticleSchema({
          title: post.translation.title,
          description: generateSeoDescription(
            post.translation.meta_description ||
              post.translation.excerpt ||
              post.translation.content,
            155,
            locale,
          ),
          wordCount: post.translation.content
            ? post.translation.content.trim().split(/\s+/).length
            : undefined,
          articleSection:
            post.categories?.[0]?.category?.translation?.name || undefined,
          image: post.featured_image || settings.default_og_image_url || "",
          datePublished: post.published_at || post.created_at,
          dateModified: post.updated_at || post.published_at || post.created_at,
          authorName:
            post.author?.name ||
            settings.founder_name ||
            settings.site_name ||
            "Author",
          authorUrl: `${getBaseUrl()}/${locale}/${pagesContentService.getCorePageSegment("about", locale) || "about"}`,
          authorImage: post.author?.avatar_url || undefined,
          authorBio:
            post.author?.bio?.[locale as keyof typeof post.author.bio] ||
            undefined,
          authorUrls: (() => {
            const authorLinks = post.author?.social_links
              ? (Object.values(post.author.social_links).filter(
                  Boolean,
                ) as string[])
              : [];
            return authorLinks.length > 0
              ? authorLinks
              : ([
                  settings.instagram_url,
                  settings.facebook_url,
                  settings.youtube_url,
                  settings.tiktok_url,
                ].filter(Boolean) as string[]);
          })(),
          publisherName:
            settings.organization_name || settings.site_name || undefined,
          publisherLogo:
            settings.logo_url || settings.default_og_image_url || undefined,
          inLanguage: locale,
          keywords: post.translation.meta_keywords || [],
          url: normalizeSchemaUrl(
            `${getBaseUrl()}/${locale}/${canonicalParentSlug}/${post.translation.slug}`,
          ),
        })}
      />

      <BreadcrumbNav customLastLabel={post.translation.title} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <article className="mx-auto">
          {/* Header */}
          <header className="mb-12">
            <div className="text-center max-w-4xl mx-auto px-4 mb-8">
              <div className="flex flex-wrap justify-center items-center gap-3 text-xs sm:text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground mb-5 sm:mb-6">
                <time dateTime={post.published_at || post.created_at}>
                  {formatBlogDate(
                    post.published_at || post.created_at,
                    locale as Locale,
                  )}
                </time>
                <span>•</span>
                <span>
                  {t("reading_time", { minutes: post.reading_time_minutes })}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal leading-[1.12] tracking-tight text-foreground mb-6 sm:mb-8 text-balance">
                {post.translation.title}
              </h1>
            </div>

            {post.featured_image && (
              <AspectRatio
                ratio={16 / 9}
                className="mb-8 rounded-[2rem] overflow-hidden shadow-md border-[0.5px] border-border/50 bg-muted/20"
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
          </header>

          {/* AI Summary / Key Takeaways */}
          {post.translation.excerpt && (
            <BlogSummary summary={post.translation.excerpt} />
          )}

          {/* Content */}
          <TableOfContents
            content={post.translation.content}
            title={t("table_of_contents")}
          />
          <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-normal prose-h2:text-4xl prose-h3:text-2xl prose-p:leading-relaxed prose-p:text-muted-foreground/90 prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:decoration-primary prose-img:rounded-[2rem] prose-img:border-[0.5px] prose-img:border-border/50 prose-img:shadow-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSlug]}
            >
              {post.translation.content}
            </ReactMarkdown>
          </div>

          {/* Author Bio */}
          <BlogAuthor
            author={post.author}
            siteSettings={settingsService.toPublicSettings(settings)}
          />

          {/* Categories & Tags */}
          <footer className="mt-12 pt-8 border-t section-contain-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {post.categories && post.categories.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-3">
                    {t("categories")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((cat) => (
                      <NextLink
                        key={cat.category.id}
                        href={`/${locale}/${canonicalParentSlug}/${getBlogTaxonomySegment("category", locale)}/${getLocalizedCategorySlug(cat.category)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-secondary text-foreground border border-border/60 shadow-sm hover:opacity-80 transition-opacity"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.category.color }}
                          aria-hidden="true"
                        />
                        {cat.category.icon && (
                          <span className="mr-0.5">{cat.category.icon}</span>
                        )}
                        {cat.category.translation?.name || cat.category.slug}
                      </NextLink>
                    ))}
                  </div>
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-3">{t("tags")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <NextLink
                        key={tag.tag.id}
                        href={`/${locale}/${canonicalParentSlug}/${getBlogTaxonomySegment("tag", locale)}/${getLocalizedTagSlug(tag.tag)}`}
                        className="px-4 py-1.5 border-[0.5px] border-border/50 bg-muted/20 hover:bg-primary/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors shadow-sm"
                      >
                        #{tag.tag.translation?.name || tag.tag.slug}
                      </NextLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </footer>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-12 border-t border-border/50">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground mb-8 text-center">
                {t("related_posts")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard
                    key={relatedPost.id}
                    // biome-ignore lint/suspicious/noExplicitAny: Type mismatch
                    post={relatedPost as any}
                    locale={locale}
                    parentSegment={canonicalParentSlug}
                  />
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
