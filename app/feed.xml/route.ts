import { getPublishedBlogPosts } from "@/lib/blog/blog-service";
import { SEO_CONFIG } from "@/lib/seo-config";
import { routing } from "@/i18n/routing";

export async function GET() {
    const baseUrl = SEO_CONFIG.site.url;
    const allItems: string[] = [];

    // Iterate through all supported locales
    for (const locale of routing.locales) {
        try {
            const { posts } = await getPublishedBlogPosts({
                page: 1,
                limit: 20,
                locale: locale,
            });

            const items = posts.map((post) => {
                // Construct localized URL (e.g., /tr/blog/slug)
                // Ensure locale is handled correctly in URL structure
                const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
                // Note: sitemap.ts logic suggests /en/ is used even for default locale if configured, 
                // but typically default locale might be at root. 
                // Looking at sitemap.ts: `languages["en"] = ${baseUrl}/${l}${localizedPath}`.
                // Let's stick to explicit locale for RSS to be safe or safer: follow existing pattern.
                // The blog-service returns posts for specific locale. 
                // Let's assume URL structure is /locale/blog/slug for non-default, and /blog/slug for default?
                // Checking sitemap.ts again: It iterates routing.locales. 
                // Actually routing.ts has defaultLocale: "en". 
                // Usually next-intl middleware handles rewrites. 
                // Best bet: Always include locale in link for RSS to avoid ambiguity or redirect chains for bots.
                const postUrl = `${baseUrl}/${locale}/blog/${post.slug}`;

                const title = post.translation?.title || "";
                const description = post.translation?.excerpt || "";

                return `
    <item>
      <title><![CDATA[${title} (${locale.toUpperCase()})]]></title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <pubDate>${new Date(post.published_at!).toUTCString()}</pubDate>
      <description><![CDATA[${description}]]></description>
      ${post.featured_image ? `<enclosure url="${post.featured_image}" length="0" type="image/jpeg"/>` : ""}
      <author>${SEO_CONFIG.site.url} (${SEO_CONFIG.person.name})</author>
      <language>${locale}</language>
    </item>`;
            });

            allItems.push(...items);
        } catch (error) {
            console.error(`Error fetching posts for locale ${locale}:`, error);
            // Continue to next locale even if one fails
        }
    }

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SEO_CONFIG.site.name} Blog (All Languages)</title>
    <link>${baseUrl}/blog</link>
    <description>${SEO_CONFIG.site.description}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${allItems.join("")}
  </channel>
</rss>`;

    return new Response(rss, {
        headers: {
            "Content-Type": "text/xml",
            "Cache-Control": "s-maxage=3600, stale-while-revalidate",
        },
    });
}
