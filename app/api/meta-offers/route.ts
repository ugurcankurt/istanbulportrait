import { NextResponse } from "next/server";
import { promoService } from "@/lib/promo-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // 1. Fetch all promo codes from the database
    const allPromos = await promoService.getAllPromoCodes();
    
    // 2. Filter for strictly active ones (not exhausted, not expired)
    const activePromos = allPromos.filter(p => {
      if (!p.is_active) return false;
      
      // Check usage limits
      if (p.max_uses !== null && p.current_uses >= p.max_uses) return false;
      
      // Check if it has expired
      if (p.end_date) {
        const end = new Date(p.end_date);
        end.setHours(23, 59, 59, 999);
        if (new Date().getTime() > end.getTime()) return false;
      }
      
      return true;
    });

    // 3. Define Meta Offers CSV Feed headers
    // Meta requires specific headers for offer data feeds
    let csv = "offer_id,title,coupon_codes,start_time,end_time,offer_type,discount_type,discount_percentage\n";

    // 4. Map database promos to CSV rows
    for (const promo of activePromos) {
      const offer_id = promo.id;
      // You can format the title however you prefer.
      const title = `${promo.discount_percentage}% Off Istanbul Photography`;
      const coupon_codes = promo.code; // The actual code they will use
      
      // Meta requires both start and end times in ISO format.
      // If none are set in the database, we provide default valid ranges.
      const now = new Date();
      const defaultStart = promo.start_date ? new Date(promo.start_date) : now;
      const defaultEnd = promo.end_date ? new Date(promo.end_date) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      const start_time = defaultStart.toISOString();
      const end_time = defaultEnd.toISOString();
      
      // Specific to Facebook Commerce promotions
      const offer_type = "BUYER_APPLIED"; 
      const discount_type = "PERCENTAGE_OFF";
      const discount_percentage = promo.discount_percentage.toString();

      // Escape helper to prevent CSV breaking with commas
      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

      csv += `${escapeCsv(offer_id)},${escapeCsv(title)},${escapeCsv(coupon_codes)},${escapeCsv(start_time)},${escapeCsv(end_time)},${escapeCsv(offer_type)},${escapeCsv(discount_type)},${escapeCsv(discount_percentage)}\n`;
    }

    // 5. Return the generated CSV
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="meta_offers.csv"`,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Error generating Meta Offers feed:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
