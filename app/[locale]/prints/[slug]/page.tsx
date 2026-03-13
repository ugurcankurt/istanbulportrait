import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { getProdigiProduct } from "@/lib/prodigi";
import { PrintConfigurator } from "@/components/print-configurator";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SEO_CONFIG } from "@/lib/seo-config";
import { PackageGallery } from "@/components/package-gallery";
import { JsonLd } from "@/lib/structured-data";
import { PrintViewTracker } from "@/components/analytics/print-view-tracker";

interface PrintDetailsPageProps {
    params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PrintDetailsPageProps) {
    const { slug } = await params;
    // The slug is the lowercased SKU. E.g: global-canvas-10x8
    const sku = slug.toUpperCase();
    const product = await getProdigiProduct(sku);

    if (!product) return {};

    return {
        title: `${product.description} | Istanbul Portrait Print Shop`,
        description: `Order a custom ${product.description}. Upload your photo and get it printed with high quality.`,
    };
}

export default async function PrintDetailsPage({ params }: PrintDetailsPageProps) {
    const { locale, slug } = await params;
    const sku = slug.toUpperCase();

    // Translation hook for matching Packages UI strings
    const tui = await getTranslations({ locale, namespace: "ui" });

    // Fetch product from Prodigi
    const product = await getProdigiProduct(sku);

    if (!product) {
        notFound();
    }

    // Use our local images mapped from the SKU, already filtered by existence in getProdigiProduct
    const imageUrls = product.imageUrls && product.imageUrls.length > 0 
        ? product.imageUrls 
        : [`/products/${product.sku.toLowerCase()}-1.webp`];
    const mainImageUrl = imageUrls[0];

    // Structured Data for Google Shopping
    const productSchema = {
        id: sku,
        sku: sku,
        name: product.description,
        description: `Order a custom ${product.description}. Upload your photo and get it printed with high quality.`,
        image: mainImageUrl,
        price: product.pricing?.eur || 0,
        currency: "EUR",
        availability: "https://schema.org/InStock" as const,
        url: `${SEO_CONFIG.site.url}/${locale}/prints/${slug}`,
        checkoutPageURLTemplate: `${SEO_CONFIG.site.url}/${locale}/prints/checkout?sku={id}`,
        category: product.category,
        brand: "Istanbul Portrait",
        condition: "new"
    };

    return (
        <div>
            <BreadcrumbNav />
            <PrintViewTracker 
                sku={product.sku}
                name={product.description || "Print"}
                category={product.subcategory || "Art"}
                price={product.pricing?.eur || 0}
            />
            <JsonLd data={require("@/lib/structured-data/generators").generateProductSchema(productSchema, require("@/lib/structured-data/utils").createSchemaConfig(locale))} />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Product Image Section (Gallery) */}
                    <div className="animate-fade-in-up lg:sticky lg:top-24 self-start">
                        <PackageGallery
                            images={imageUrls}
                            alt={product.description}
                        />

                    </div>

                    {/* Configuration and Upload Section */}
                    <div className="flex flex-col animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-primary border-primary">
                                    Professional {product.category}
                                </Badge>
                                <Badge className="bg-primary text-primary-foreground">
                                    {product.subcategory}
                                </Badge>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                                {product.description}
                            </h1>

                            <div className="flex items-end gap-3 mb-6">
                                <div className="text-4xl font-bold text-primary">
                                    €{(product.pricing?.eur || 0).toFixed(2)}
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                SKU: {product.sku}
                            </p>
                        </div>

                        {/* What to Expect - Now consistent for all screens */}
                        <div className="space-y-6 mb-12">
                            <h3 className="text-xl font-semibold">{tui?.("what_to_expect") || "What to Expect"}</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                                        <Check className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-base">Expertly crafted {product.description.toLowerCase()} products using archival inks.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                                        <Check className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-base">High-resolution print quality (200+ DPI recommended).</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                                        <Check className="h-4 w-4 text-primary" />
                                    </div>
                                    <span className="text-base">Robust packaging for safe global shipping.</span>
                                </li>
                            </ul>
                        </div>

                        {/* The interactive client component for file uploads and cart logic */}
                        <div className="mt-auto">
                            <PrintConfigurator product={product} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
