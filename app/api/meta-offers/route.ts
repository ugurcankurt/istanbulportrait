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

    // 3. Define Meta Offers CSV Feed headers exactly as specified in the official documentation
    let csv = "offer_id,title,value_type,percent_off,application_type,public_coupon_code,target_type,target_granularity,target_selection,start_date_time,end_date_time\n";

    // 4. Map database promos to CSV rows
    for (const promo of activePromos) {
      const offer_id = promo.id;
      const title = `${promo.discount_percentage}% Off Promo - ${promo.code}`;
      
      const value_type = "PERCENTAGE";
      const percent_off = promo.discount_percentage.toString();
      const application_type = "BUYER_APPLIED";
      const public_coupon_code = promo.code.substring(0, 20); // max 20 chars
      
      const target_type = "LINE_ITEM";
      const target_granularity = "ORDER_LEVEL";
      const target_selection = "ALL_CATALOG_PRODUCTS";
      
      const now = new Date();
      const defaultStart = promo.start_date ? new Date(promo.start_date) : now;
      const defaultEnd = promo.end_date ? new Date(promo.end_date) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      const start_date_time = defaultStart.toISOString().split('.')[0] + 'Z';
      const end_date_time = defaultEnd.toISOString().split('.')[0] + 'Z';

      // Escape helper to prevent CSV breaking with commas
      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

      csv += `${escapeCsv(offer_id)},${escapeCsv(title)},${escapeCsv(value_type)},${escapeCsv(percent_off)},${escapeCsv(application_type)},${escapeCsv(public_coupon_code)},${escapeCsv(target_type)},${escapeCsv(target_granularity)},${escapeCsv(target_selection)},${escapeCsv(start_date_time)},${escapeCsv(end_date_time)}\n`;
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
