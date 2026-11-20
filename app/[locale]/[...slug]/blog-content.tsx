import NextLink from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BlogCard } from "@/components/blog-card";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { PageHeroSection } from "@/components/page-hero-section";
import { SchemaInjector } from "@/components/schema-injector";
import { getPublishedBlogPosts } from "@/lib/blog/blog-service";
import { pagesContentService } from "@/lib/pages-content-service";
import {
  buildCollectionPageSchema,
  enrichSeoDescription,
  generateSeoDescription,
  getBaseUrl,
  normalizeSchemaUrl,
} from "@/lib/seo-utils";
import { settingsService } from "@/lib/settings-service";
import type { Locale } from "@/types/blog";

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
  const page = Math.max(1, Number.parseInt(pageParam || "1", 10) || 1);

  const [dbPage, settings] = await Promise.all([
    pagesContentService.getPageBySlug("blog"),
    settingsService.getSettings(),
  ]);
  const dynamicTitle = dbPage?.title?.[locale] || dbPage?.title?.en || "blog";
  const dynamicSubtitle =
    dbPage?.subtitle?.[locale] || dbPage?.subtitle?.en || "";
  const parentSegment =
    pagesContentService.getCorePageSegment(dbPage || "blog", locale) || "blog";
  const baseUrl = getBaseUrl(settings.app_base_url);
  const canonicalPath = `/${locale}/${parentSegment}`;

  const { posts, pagination } = await getPublishedBlogPosts({
    page,
    limit: 12,
    locale,
    sort_by: "published_at",
    sort_order: "desc",
  });

  if (page > 1 && page > Math.max(1, pagination.totalPages)) {
    notFound();
  }

  const pageUrl = `${normalizeSchemaUrl(`${baseUrl}${canonicalPath}`)}${page > 1 ? `?page=${page}` : ""}`;

  const collectionSchema = buildCollectionPageSchema({
    name: page > 1 ? `${dynamicTitle} - ${page}` : dynamicTitle,
    description: enrichSeoDescription(dynamicSubtitle, "blog", locale),
    url: pageUrl,
    inLanguage: locale,
    items: posts.map((post) => ({
      name: post.translation.title,
      description: post.translation.excerpt
        ? generateSeoDescription(post.translation.excerpt, 155, locale)
        : undefined,
      url: normalizeSchemaUrl(
        `${baseUrl}/${locale}/${parentSegment}/${post.translation.slug}`,
      ),
      image: post.featured_image || undefined,
    })),
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
                <BlogCard
                  key={post.id}
                  post={post}
                  locale={locale}
                  parentSegment={parentSegment}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-4 items-center mt-8">
              {page > 1 && (
                <NextLink
                  href={
                    page - 1 <= 1
                      ? canonicalPath
                      : `${canonicalPath}?page=${page - 1}`
                  }
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
                  href={`${canonicalPath}?page=${page + 1}`}
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
