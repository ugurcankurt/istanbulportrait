import { convertCurrency } from "./currency";
import fs from "fs";
import path from "path";
import { cache } from "react";
import { 
    type ProdigiProduct, 
    autoCategorize, 
    calculatePriceWithMargin 
} from "./prodigi-shared";

export { type ProdigiProduct, PRINTS_CATEGORIES } from "./prodigi-shared";

function getBaseUrl() {
    return process.env.PRODIGI_ENV === "live"
        ? "https://api.prodigi.com/v4.0"
        : "https://api.sandbox.prodigi.com/v4.0";
}

function getHeaders() {
    return {
        "X-API-Key": process.env.PRODIGI_API_KEY || "",
        "Content-Type": "application/json",
    };
}

// In-memory cache for quote costs to avoid repeated heavy fallback calls
const quoteCache: Map<string, number> = new Map();
const QUOTE_CACHE_DURATION = 1000 * 60 * 60; // 1 hour
interface CachedQuote {
    cost: number;
    timestamp: number;
}
const quoteCacheFull: Map<string, CachedQuote> = new Map();

/**
 * Fetches a quote for a specific SKU to get authoritative pricing.
 * Used as a fallback when standard pricing fields are missing.
 */
async function getQuoteForSku(sku: string, attributes?: Record<string, string>): Promise<number> {
    const cacheKey = `${sku}-${JSON.stringify(attributes || {})}`;
    const cached = quoteCacheFull.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUOTE_CACHE_DURATION) {
        return cached.cost;
    }

    const baseUrl = getBaseUrl();

    try {
        const quoteRequest: any = {
            destinationCountryCode: "TR", // Default destination for pricing reference
            items: [
                {
                    sku: sku,
                    copies: 1,
                    assets: [{ printArea: "default" }]
                }
            ]
        };

        if (attributes && Object.keys(attributes).length > 0) {
            quoteRequest.items[0].attributes = attributes;
        }

        const response = await fetch(`${baseUrl}/Quotes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(quoteRequest)
        });

        const data = await response.json();

        if (!response.ok) {
            // If missing attributes, try to resolve once from the error response
            if (data.outcome === "ValidationFailed" && data.failures?.["items[0].attributes"]) {
                const missing = data.failures["items[0].attributes"];
                const autoResolvedAttributes: Record<string, string> = { ...attributes };

                missing.forEach((fail: any) => {
                    if (fail.code === "MissingRequiredAttributes" && fail.missingItems?.attributes) {
                        fail.missingItems.attributes.forEach((attr: any) => {
                            if (attr.name && attr.validValues?.length > 0) {
                                // Pick the first valid value for the missing attribute
                                autoResolvedAttributes[attr.name] = attr.validValues[0];
                            }
                        });
                    }
                });

                if (Object.keys(autoResolvedAttributes).length > (attributes ? Object.keys(attributes).length : 0)) {
                    if (process.env.NODE_ENV === "development") {
                        console.log(`[Prodigi] Retrying quote for ${sku} with resolved attributes:`, autoResolvedAttributes);
                    }
                    return await getQuoteForSku(sku, autoResolvedAttributes);
                }
            }

            console.error(`[Prodigi] Quote failed for ${sku}: ${response.status}`, JSON.stringify(data));
            return 0;
        }

        // Extract cost from the first quote option
        const quote = data.quotes?.[0];
        const itemInfo = quote?.items?.[0];

        if (itemInfo?.unitCost) {
            const amount = parseFloat(itemInfo.unitCost.amount);
            const currency = itemInfo.unitCost.currency;
            const cost = await convertCurrency(amount, currency, "EUR");
            
            quoteCacheFull.set(cacheKey, { cost, timestamp: Date.now() });
            return cost;
        }

        return 0;
    } catch (error) {
        console.error(`[Prodigi] Error fetching quote for ${sku}:`, error);
        return 0;
    }
}

/**
 * Maps Prodigi SKU to an array of existing image paths in /public/products/
 * Automatically checks for file existence and supports up to 10 images.
 */
export function getProductImageUrls(sku: string): string[] {
    const urls: string[] = [];
    const publicDir = path.join(process.cwd(), "public");
    
    // Check for both lowercase and uppercase variations to be safe
    const baseNames = [sku.toLowerCase(), sku.toUpperCase()];
    
    for (let i = 1; i <= 10; i++) {
        let found = false;
        for (const base of baseNames) {
            const relPath = `/products/${base}-${i}.webp`;
            const fullPath = path.join(publicDir, relPath);
            
            if (fs.existsSync(fullPath)) {
                urls.push(relPath);
                found = true;
                break;
            }
        }
    }

    // Fallback: If no images found at all, return at least the first one as a placeholder
    if (urls.length === 0) {
        urls.push(`/products/${sku.toLowerCase()}-1.webp`);
    }

    return urls;
}

/**
 * Fetches product details by SKU.
 * Wrapped in cache() for request deduplication across a single request.
 */
export const getProdigiProduct = cache(async (sku: string): Promise<ProdigiProduct | null> => {
    if (!process.env.PRODIGI_API_KEY) {
        console.warn("PRODIGI_API_KEY is not defined.");
        return null;
    }

    try {
        const response = await fetch(`${getBaseUrl()}/Products/${sku}`, {
            method: "GET",
            headers: getHeaders(),
            next: { revalidate: 86400 }, // Cache products for 24 hours (they rarely change)
        });

        if (!response.ok) {
            console.error(`Failed to fetch product ${sku}: Status ${response.status}`, await response.text());
            return null;
        }

        const data = await response.json();
        const product = data.product || data; // Handle different API response styles

        // Extract pricing with multiple fallbacks for Live environment v4 structure
        let costEur = 0;

        // Diagnostic log: See what the API actually returns
        if (process.env.NODE_ENV === "development") {
            console.log(`[Prodigi Debug] Raw data for ${sku}:`, JSON.stringify(product).substring(0, 500) + "...");
        }

        // Helper to extract numeric value from various Prodigi price structures
        const extractValue = (p: any): number => {
            if (typeof p === 'number') return p;
            if (typeof p === 'string') return parseFloat(p);
            if (p?.amount) return typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount;
            return 0;
        };

        // 1. Try pagePricing (Sandbox/Common)
        if (product.pagePricing?.eur) {
            costEur = extractValue(product.pagePricing.eur);
        }
        // 2. Try variants[0].pagePricing
        else if (product.variants?.[0]?.pagePricing?.eur) {
            costEur = extractValue(product.variants[0].pagePricing.eur);
        }
        // 3. Try costPrice array (Varying across Live/Sandbox)
        else {
            const pricingSource = product.variants?.[0] || product;
            const prices = pricingSource.costPrice || pricingSource.prices || pricingSource.itemPrice;

            if (Array.isArray(prices)) {
                const eurPrice = prices.find((p: any) => (p.currencyCode || p.currency)?.toUpperCase() === "EUR");
                if (eurPrice) {
                    costEur = extractValue(eurPrice);
                } else if (prices.length > 0) {
                    // Fallback to first available currency and convert
                    const firstPrice = prices[0];
                    const amount = extractValue(firstPrice);
                    const curr = firstPrice.currencyCode || firstPrice.currency || "USD";
                    costEur = await convertCurrency(amount, curr, "EUR");
                }
            } else if (typeof prices === 'object' && prices !== null) {
                // Object mapping style
                costEur = extractValue(prices.eur || prices.EUR);
                if (costEur === 0) {
                    const fallbackKey = Object.keys(prices)[0];
                    if (fallbackKey) {
                        costEur = await convertCurrency(extractValue(prices[fallbackKey]), fallbackKey, "EUR");
                    }
                }
            }
        }

        // 4. ULTIMATE FALLBACK: Authoritative Quote
        if (costEur === 0) {
            if (process.env.NODE_ENV === "development") {
                console.log(`[Prodigi Debug] Standard fields null for ${sku}, trying authoritative quote...`);
            }

            // Try to pre-resolve some attributes if available in the product object
            const defaultAttributes: Record<string, string> = {};
            if (product.attributes) {
                Object.entries(product.attributes).forEach(([key, values]) => {
                    if (Array.isArray(values) && values.length > 0) {
                        defaultAttributes[key] = values[0];
                    }
                });
            }

            costEur = await getQuoteForSku(sku, defaultAttributes);
        }

        if (process.env.NODE_ENV === "development") {
            console.log(`[Prodigi Debug] ${sku} - Extracted Cost EUR:`, costEur);
        }

        const retailPrice = calculatePriceWithMargin(costEur);
        const catInfo = autoCategorize(product.sku, product.description);

        const mappedProduct: ProdigiProduct = {
            sku: product.sku,
            description: product.description,
            category: catInfo.category,
            subcategory: catInfo.subcategory,
            attributes: product.attributes,
            pricing: {
                eur: retailPrice
            },
            imageUrls: getProductImageUrls(product.sku)
        };

        return mappedProduct;
    } catch (error) {
        console.error("Error fetching Prodigi product:", error);
        return null;
    }
});

/**
 * Fetches a list of products. 
 */
export async function getProdigiCatalog(): Promise<ProdigiProduct[]> {
    if (!process.env.PRODIGI_API_KEY) {
        console.warn("PRODIGI_API_KEY is not defined.");
        return [];
    }

    const allowedSkus = [
        "GLOBAL-FRA-CAN-16X20"
    ];

    try {
        const productsPromises = allowedSkus.map(sku => getProdigiProduct(sku));
        const productsResults = await Promise.all(productsPromises);
        const products = productsResults.filter((p): p is ProdigiProduct => p !== null);
        return products;
    } catch (error) {
        console.error("Error fetching Prodigi product catalog concurrently:", error);
        return [];
    }
}

/**
 * Create a new order via Prodigi API.
 */
export async function createProdigiOrder(orderData: any) {
    if (!process.env.PRODIGI_API_KEY) {
        throw new Error("PRODIGI_API_KEY is not defined.");
    }

    try {
        const response = await fetch(`${getBaseUrl()}/Orders`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(orderData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to create Prodigi order: Status ${response.status}`, data);
            throw new Error(data.message || "Failed to create order on Prodigi.");
        }

        return data; 
    } catch (error) {
        console.error("Error creating Prodigi order:", error);
        throw error;
    }
}

/**
 * Get shipping quotes for a given destination and items.
 */
export async function getProdigiQuote(quoteData: any) {
    if (!process.env.PRODIGI_API_KEY) {
        throw new Error("PRODIGI_API_KEY is not defined.");
    }

    try {
        const response = await fetch(`${getBaseUrl()}/Quotes`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(quoteData),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to fetch Prodigi quote: Status ${response.status}`, data);
            throw new Error(data.message || "Failed to fetch shipping quote from Prodigi.");
        }

        return data;
    } catch (error) {
        console.error("Error fetching Prodigi quote:", error);
        throw error;
    }
}

/**
 * Get details of an existing order by ID.
 */
export async function getProdigiOrder(orderId: string) {
    if (!process.env.PRODIGI_API_KEY) {
        throw new Error("PRODIGI_API_KEY is not defined.");
    }

    try {
        const response = await fetch(`${getBaseUrl()}/Orders/${orderId}`, {
            method: "GET",
            headers: getHeaders(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`Failed to fetch Prodigi order ${orderId}: Status ${response.status}`, data);
            return null;
        }

        return data.order || data; 
    } catch (error) {
        console.error(`Error fetching Prodigi order ${orderId}:`, error);
        return null;
    }
}
