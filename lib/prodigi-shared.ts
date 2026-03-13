export interface ProdigiProduct {
    sku: string;
    description: string;
    category?: string;
    subcategory?: string;
    attributes?: Record<string, any>;
    printAreas?: Record<string, any>;
    pricing?: {
        gbp?: number;
        usd?: number;
        eur?: number;
    };
    assets?: {
        url: string;
    }[];
    imageUrls?: string[];
}

export function calculatePriceWithMargin(cost: number): number {
    return Math.ceil(cost * 1.5);
}

/**
 * Defined category hierarchy as requested by user
 */
export const PRINTS_CATEGORIES = [
    { id: "prints-posters", label: "Prints & posters", subcategories: ["Fine Art", "Posters", "Photo Prints"] },
    { id: "wall-art", label: "Wall art", subcategories: ["Canvas", "Framed Canvas", "Metal Prints", "Acrylic Prints"] },
    { id: "stickers", label: "Stickers", subcategories: ["Vinyl Stickers", "Kiss Cut", "Die Cut"] },
    { id: "technology", label: "Technology", subcategories: ["Phone Cases", "Laptop Sleeves", "Tablet Cases"] },
    { id: "books-magazines", label: "Books & magazines", subcategories: ["Photo Books", "Notebooks", "Journals"] },
    { id: "home-living", label: "Home & living", subcategories: ["Mugs", "Pillows", "Blankets", "Towels"] },
    { id: "cards-stationery", label: "Cards & stationery", subcategories: ["Greeting Cards", "Postcards", "Calendars"] },
    { id: "sport-games", label: "Sport & games", subcategories: ["Puzzles", "Playing Cards", "Yoga Mats"] },
    { id: "mens-clothing", label: "Men's clothing", subcategories: ["T-shirts", "Hoodies", "Sweatshirts"] },
    { id: "womens-clothing", label: "Women's clothing", subcategories: ["T-shirts", "Hoodies", "Dresses"] },
    { id: "kids-clothing", label: "Kids' clothing", subcategories: ["Baby Onesies", "T-shirts", "Hoodies"] },
    { id: "accessories", label: "Accessories", subcategories: ["Tote Bags", "Hats", "Face Masks"] },
    { id: "business-commercial", label: "Business & commercial", subcategories: ["Business Cards", "Flyers", "Brochures"] },
];

/**
 * Automatically categorizes a product based on its SKU and description.
 * Safe for both client and server.
 */
export function autoCategorize(sku: string, description: string = ""): { category: string; subcategory: string } {
    const s = sku.toUpperCase();
    const d = description.toLowerCase();

    // Wall Art & Canvas
    if (s.includes("CAN") || d.includes("canvas")) {
        if (d.includes("frame") || s.includes("FRA") || s.includes("CFP")) {
            return { category: "Wall art", subcategory: "Framed Canvas" };
        }
        return { category: "Wall art", subcategory: "Canvas" };
    }
    
    if (s.includes("MET") || d.includes("metal print")) {
        return { category: "Wall art", subcategory: "Metal Prints" };
    }
    
    if (s.includes("ACR") || d.includes("acrylic")) {
        return { category: "Wall art", subcategory: "Acrylic Prints" };
    }

    // Prints & Posters
    if (s.includes("FAP") || s.includes("SAP") || d.includes("fine art") || d.includes("art paper")) {
        return { category: "Prints & posters", subcategory: "Fine Art" };
    }
    
    if (s.includes("POS") || d.includes("poster")) {
        return { category: "Prints & posters", subcategory: "Posters" };
    }
    
    if (s.includes("PHP") || d.includes("photo print")) {
        return { category: "Prints & posters", subcategory: "Photo Prints" };
    }

    // Technology
    if (s.includes("TECH") || s.includes("IP1") || d.includes("phone case")) {
        return { category: "Technology", subcategory: "Phone Cases" };
    }
    
    if (d.includes("laptop sleeve")) {
        return { category: "Technology", subcategory: "Laptop Sleeves" };
    }

    // Stickers
    if (s.includes("STICKER") || d.includes("sticker")) {
        return { category: "Stickers", subcategory: "Vinyl Stickers" };
    }

    // Books & Magazines
    if (s.includes("BOOK") || d.includes("book")) {
        return { category: "Books & magazines", subcategory: "Photo Books" };
    }
    
    if (d.includes("notebook") || d.includes("journal")) {
        return { category: "Books & magazines", subcategory: "Notebooks" };
    }

    // Home & Living
    if (s.includes("MUG") || d.includes("mug")) {
        return { category: "Home & living", subcategory: "Mugs" };
    }
    
    if (d.includes("pillow") || d.includes("cushion")) {
        return { category: "Home & living", subcategory: "Pillows" };
    }

    // Cards & Stationery
    if (s.includes("CALENDAR") || d.includes("calendar")) {
        return { category: "Cards & stationery", subcategory: "Calendars" };
    }
    
    if (d.includes("greeting card")) {
        return { category: "Cards & stationery", subcategory: "Greeting Cards" };
    }

    // Clothing (Simple detection)
    if (d.includes("t-shirt") || d.includes("tee")) {
        if (d.includes("women")) return { category: "Women's clothing", subcategory: "T-shirts" };
        if (d.includes("kids") || d.includes("baby")) return { category: "Kids' clothing", subcategory: "T-shirts" };
        return { category: "Men's clothing", subcategory: "T-shirts" };
    }

    // Default
    return { category: "Other", subcategory: "General" };
}
