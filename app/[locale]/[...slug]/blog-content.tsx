
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PageHeroSection } from "@/components/page-hero-section";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import NextLink from "next/link";
import { getPublishedBlogPosts } from "@/lib/blog/blog-service";
import { formatBlogDate } from "@/lib/blog/blog-utils";

import type { Locale } from "@/types/blog";
import { pagesContentService } from "@/lib/pages-content-service";
import { generateNativeSlug } from "@/lib/slug-generator";
import { SchemaInjector } from "@/components/schema-injector";
import { buildCollectionPageSchema, generateSeoDescription, getBaseUrl } from "@/lib/seo-utils";

// Force dynamic rendering for blog list page (uses searchParams)
export const dynamic = "force-dynamic";



export async function BlogPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const t = await getTranslations({ locale, namespace: "blog" });
  const page = Number.parseInt(pageParam || "1", 10);

  const dbPage = await pagesContentService.getPageBySlug("blog");
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "blog";
  const dynamicSubtitle = dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";
  const parentSegment = dbPage?.title?.[locale] ? generateNativeSlug(dbPage.title[locale]!) : "blog";

  const { posts, pagination } = await getPublishedBlogPosts({
    page,
    limit: 12,
    locale,
    sort_by: "published_at",
    sort_order: "desc",
  });

  const collectionSchema = buildCollectionPageSchema({
    name: dynamicTitle,
    description: generateSeoDescription(dynamicSubtitle),
    url: `${getBaseUrl()}/${locale}/${parentSegment}`,
    items: posts.map(post => ({
      name: post.translation.title,
      description: post.translation.excerpt ? generateSeoDescription(post.translation.excerpt) : undefined,
      url: `${getBaseUrl()}/${locale}/${parentSegment}/${post.translation.slug}`,
      image: post.featured_image || undefined
    }))
  });

  return (
    <div>
      <SchemaInjector schema={collectionSchema} />
      <BreadcrumbNav customLastLabel={dynamicTitle || undefined} />
      <PageHeroSection title={dynamicTitle} subtitle={dynamicSubtitle} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 section-contain-auto">
        <div className="mx-auto">
          {/* Blog Grid */}
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("no_posts")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {posts.map((post) => (
                <NextLink
                  key={post.id}
                  href={`/${locale}/${parentSegment}/${post.translation.slug}`}
                  className="group"
                >
                  <article className="rounded-[2rem] border-[0.5px] border-border/50 bg-background overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 h-full flex flex-col">
                    {post.featured_image && (
                      <AspectRatio
                        ratio={4 / 3}
                        className="overflow-hidden relative bg-muted"
                      >
                        <Image
                          src={post.featured_image}
                          alt={post.translation.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          quality={60}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {post.is_featured && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-background/90 text-primary backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-sm">
                              {t("featured")}
                            </span>
                          </div>
                        )}
                      </AspectRatio>
                    )}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col">
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat.category.id}
                              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                              style={{
                                backgroundColor: `${cat.category.color}15`,
                                color: cat.category.color,
                              }}
                            >
                              {cat.category.translation?.name ||
                                cat.category.slug}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-2xl font-serif leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {post.translation.title}
                      </h2>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4 flex flex-wrap items-center gap-2">
                        <span>{formatBlogDate(post.published_at || post.created_at, locale)}</span>
                        <span>•</span>
                        <span>{t("reading_time", { minutes: post.reading_time_minutes })}</span>
                      </p>
                      {post.translation.excerpt && (
                        <p className="text-muted-foreground/80 leading-relaxed line-clamp-3 flex-1 text-sm">
                          {post.translation.excerpt}
                        </p>
                      )}
                    </div>
                  </article>
                </NextLink>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-4 items-center mt-8">
              {page > 1 && (
                <NextLink
                  href={`?page=${page - 1}`}
                  className="px-6 py-2.5 border-[0.5px] border-border/50 rounded-[1.5rem] hover:bg-muted/50 transition-all font-semibold shadow-sm text-sm"
                >
                  {t("previous")}
                </NextLink>
              )}
              <span className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {t("page", { current: page, total: pagination.totalPages })}
              </span>
              {page < pagination.totalPages && (
                <NextLink
                  href={`?page=${page + 1}`}
                  className="px-6 py-2.5 border-[0.5px] border-border/50 rounded-[1.5rem] hover:bg-muted/50 transition-all font-semibold shadow-sm text-sm"
                >
                  {t("next")}
                </NextLink>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
