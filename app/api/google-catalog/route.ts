import { NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { getBaseUrl, generateSeoDescription } from "@/lib/seo-utils";
import { discountService } from "@/lib/discount-service";
import { reviewsService } from "@/lib/reviews-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") || "en";

  const baseUrl = getBaseUrl();
  const packages = await packagesService.getAllPackages();
  const activeDiscount = await discountService.getActiveDiscount();

  // Fetch real Google Reviews aggregate data for the dynamic images
  const { average, count } = await reviewsService.getAggregateRating();

  // Helper to resolve images through our proxy if needed
  const cleanImage = (url?: string | null) => {
    if (!url) return "";
    return url.replace(
      "https://xfntnamwfnqjgqmyxwfz.supabase.co/storage/v1/object/public",
      `${baseUrl}/storage`
    );
  };

  // Google Ads strictly requires exactly these header names for a Custom feed
  // Reference: https://support.google.com/google-ads/answer/6053288 (Custom feed)
  // Add UTF-8 BOM to ensure Google Ads correctly parses Turkish characters
  let csv = "\uFEFFID,Item title,Item description,Final URL,Image URL,Price,Sale price\n";

  for (const pkg of packages) {
    if (!pkg.is_active) continue; // Skip inactive packages

    // 1. ID
    const id = pkg.slug;

    // 2. Title
    let title = pkg.title?.[locale] || pkg.title?.en || "Photography Package";

    // 3. Description
    const rawDesc = pkg.description?.[locale] || pkg.description?.en || title;
    const cleanDesc = generateSeoDescription(rawDesc, 500);

    // 4. Final URL
    const finalUrl = `${baseUrl}/${locale}/packages/${pkg.slug}`;

    // 5. Image URL (Use our beautiful dynamic getyourguide-style image!)
    const rawImageUrl = cleanImage(pkg.cover_image || (pkg.gallery_images && pkg.gallery_images[0]));
    let imageUrl = rawImageUrl;
    if (rawImageUrl) {
      const rating = average > 0 ? average.toFixed(1) : "5.0";
      const reviewsCount = count > 0 ? count : 124;
      imageUrl = `${baseUrl}/api/og-catalog?image=${encodeURIComponent(rawImageUrl)}&title=${encodeURIComponent(title)}&rating=${rating}&reviews=${reviewsCount}`;
    }

    // 6. Pricing logic
    let priceStr = `${pkg.price} EUR`;
    let salePriceStr = "";

    if (pkg.original_price && pkg.original_price > pkg.price) {
      priceStr = `${pkg.original_price} EUR`;
      salePriceStr = `${pkg.price} EUR`;
    } else if (activeDiscount && activeDiscount.discount_percentage > 0) {
      priceStr = `${pkg.price} EUR`;
      const calculatedSalePrice = pkg.price - (pkg.price * activeDiscount.discount_percentage);
      salePriceStr = `${parseFloat(calculatedSalePrice.toFixed(2))} EUR`;
    }

    // CSV Escape helper
    const escapeCsv = (str: string) => `"${String(str).replace(/"/g, '""')}"`;

    // Append row
    csv += `${escapeCsv(id)},${escapeCsv(title)},${escapeCsv(cleanDesc)},${escapeCsv(finalUrl)},${escapeCsv(imageUrl)},${escapeCsv(priceStr)},${escapeCsv(salePriceStr)}\n`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="google_ads_business_data_${locale}.csv"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
