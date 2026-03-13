import { getTranslations } from "next-intl/server";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { getProdigiCatalog } from "@/lib/prodigi";
import { Badge } from "@/components/ui/badge";
import { CategoryFilter } from "@/components/category-filter";
import Link from "next/link";
import { JsonLd } from "@/lib/structured-data";
import { PrintGalleryTracker } from "@/components/analytics/print-gallery-tracker";
import { Globe } from "lucide-react";
import { FloatingGlobalBadge } from "@/components/floating-global-badge";

interface PrintsPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({ params }: PrintsPageProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "prints" });
    return {
        title: `${t("title")} | Istanbul Portrait`,
        description: t("subtitle"),
    };
}

export default async function PrintsPage({ params, searchParams }: PrintsPageProps) {
    const { locale } = await params;
    const { category } = await searchParams;
    const t = await getTranslations({ locale, namespace: "prints" });
    const tui = await getTranslations({ locale, namespace: "ui" });

    // Fetch curated products from our updated Prodigi client
    let products = await getProdigiCatalog();

    // Filter by category if provided in searchParams
    if (category) {
        products = products.filter(p => p.category === category);
    }

    return (
        <div>
            <BreadcrumbNav />
            <PrintGalleryTracker products={products} />
            <JsonLd data={require("@/lib/structured-data/generators").generateItemListSchema(
                products.map((p, i) => ({
                    name: p.description,
                    description: p.description,
                    url: `${require("@/lib/seo-config").SEO_CONFIG.site.url}/${locale}/prints/${p.sku.toLowerCase()}`,
                    image: p.imageUrls?.[0] || `${require("@/lib/seo-config").SEO_CONFIG.site.url}/products/${p.sku.toLowerCase()}-1.webp`,
                    position: i + 1
                })),
                "Print Shop Catalog",
                require("@/lib/structured-data/utils").createSchemaConfig(locale)
            )} />

            <div className="bg-gradient-to-b from-background to-muted/20">
                <FloatingGlobalBadge />
                <section className="py-8 sm:py-10 lg:py-12 relative">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">

                        <div className="text-center mb-10 sm:mb-12 animate-fade-in-up">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                                {t("title")}
                            </h1>
                            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 px-2">
                                {t("subtitle")}
                            </p>

                            <CategoryFilter />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in-up">
                            {products.length > 0 ? (
                                products.map((product) => {
                                    // Load from our local /public/products folder based on SKU
                                    const imageUrl = product.imageUrls?.[0] || `/products/${product.sku.toLowerCase()}-1.webp`;

                                    return (
                                        <Link
                                            key={product.sku}
                                            href={`/${locale}/prints/${product.sku.toLowerCase()}`}
                                            className="group block overflow-hidden rounded-xl bg-background border border-muted hover:border-primary/30 transition-colors shadow-sm hover:shadow-md"
                                        >
                                            <article className="flex flex-col h-full">
                                                {/* Product Image - 4x4 (1:1) Aspect Ratio, flush */}
                                                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                                                    <img
                                                        src={imageUrl}
                                                        alt={product.description}
                                                        className="object-cover w-full h-full"
                                                    />

                                                    {/* Category Badge - Minimalist */}
                                                    <div className="absolute top-2 left-2">
                                                        <Badge className="bg-background/90 backdrop-blur-sm text-foreground border-none text-[9px] px-1.5 py-0 font-medium">
                                                            {product.category}
                                                        </Badge>
                                                    </div>

                                                    {/* Price Badge - Flush bottom-right */}
                                                    <div className="absolute bottom-0 right-0">
                                                        <div className="bg-primary text-primary-foreground px-2.5 py-1 font-bold text-xs rounded-tl-lg shadow-sm">
                                                            {product.pricing?.eur ? `€${product.pricing.eur.toFixed(2)}` : "Price on Request"}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content Area - Minimalist padding */}
                                                <div className="p-3 bg-background">
                                                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                                                        {product.subcategory}
                                                    </p>
                                                    <h3 className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                                        {product.description}
                                                    </h3>
                                                </div>
                                            </article>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-24 text-muted-foreground bg-background/50 backdrop-blur rounded-2xl border-2 border-dashed border-primary/20">
                                    <div className="max-w-md mx-auto">
                                        <p className="text-xl font-semibold mb-2">No products found</p>
                                        <p className="text-sm">Try selecting a different category or check back later.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
