
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {posts.map((post) => (
                <NextLink
                  key={post.id}
                  href={`/${locale}/${parentSegment}/${post.translation.slug}`}
                  className="group"
                >
                  <article className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                    {post.featured_image && (
                      <AspectRatio
                        ratio={16 / 9}
                        className="overflow-hidden relative bg-muted"
                      >
                        <Image
                          src={post.featured_image}
                          alt={post.translation.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          quality={50}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {post.is_featured && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                              {t("featured")}
                            </span>
                          </div>
                        )}
                      </AspectRatio>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      {post.categories && post.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {post.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat.category.id}
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: `${cat.category.color}20`,
                                color: cat.category.color,
                              }}
                            >
                              {cat.category.translation?.name ||
                                cat.category.slug}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.translation.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        {formatBlogDate(
                          post.published_at || post.created_at,
                          locale,
                        )}{" "}
                        •{" "}
                        {t("reading_time", {
                          minutes: post.reading_time_minutes,
                        })}
                      </p>
                      {post.translation.excerpt && (
                        <p className="text-muted-foreground line-clamp-3 flex-1">
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
            <div className="flex justify-center gap-2 items-center">
              {page > 1 && (
                <NextLink
                  href={`?page=${page - 1}`}
                  className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                >
                  {t("previous")}
                </NextLink>
              )}
              <span className="px-4 py-2 text-sm text-muted-foreground">
                {t("page", { current: page, total: pagination.totalPages })}
              </span>
              {page < pagination.totalPages && (
                <NextLink
                  href={`?page=${page + 1}`}
                  className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
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
