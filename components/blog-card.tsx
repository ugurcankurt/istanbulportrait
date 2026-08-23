import Image from "next/image";
import NextLink from "next/link";
import { getTranslations } from "next-intl/server";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { formatBlogDate } from "@/lib/blog/blog-utils";
import type { BlogPostWithRelations } from "@/types/blog";

interface BlogCardProps {
  post: BlogPostWithRelations;
  locale: string;
  parentSegment: string;
}

export async function BlogCard({ post, locale, parentSegment }: BlogCardProps) {
  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <NextLink
      href={`/${locale}/${parentSegment}/${post.translation.slug}`}
      className="group h-full block"
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
                  {cat.category.translation?.name || cat.category.slug}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-2xl font-serif leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {post.translation.title}
          </h2>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4 flex flex-wrap items-center gap-2">
            <span>
              {formatBlogDate(
                post.published_at || post.created_at,
                locale as any,
              )}
            </span>
            <span>•</span>
            <span>
              {t("reading_time", { minutes: post.reading_time_minutes })}
            </span>
          </p>
          {post.translation.excerpt && (
            <p className="text-muted-foreground/80 leading-relaxed line-clamp-3 flex-1 text-sm">
              {post.translation.excerpt}
            </p>
          )}
        </div>
      </article>
    </NextLink>
  );
}
