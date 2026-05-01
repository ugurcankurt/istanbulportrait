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
    // Meta's parser can be very strict. Using 'id' instead of 'offer_id', adding 'description' and 'target_selection'.
    let csv = "id,title,description,coupon_codes,start_time,end_time,offer_type,discount_type,discount_value,target_selection\n";

    // 4. Map database promos to CSV rows
    for (const promo of activePromos) {
      const id = promo.id;
      const title = `${promo.discount_percentage}% Off Istanbul Photography`;
      const description = `Apply code ${promo.code} at checkout to get ${promo.discount_percentage}% off.`;
      const coupon_codes = promo.code; 
      
      const now = new Date();
      const defaultStart = promo.start_date ? new Date(promo.start_date) : now;
      const defaultEnd = promo.end_date ? new Date(promo.end_date) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      // Fix: Facebook's CSV parser often rejects ISO dates if they contain milliseconds (.000Z).
      // We strip the milliseconds format to be strictly YYYY-MM-DDThh:mm:ssZ
      const start_time = defaultStart.toISOString().split('.')[0] + 'Z';
      const end_time = defaultEnd.toISOString().split('.')[0] + 'Z';
      
      const offer_type = "BUYER_APPLIED"; 
      const discount_type = "PERCENTAGE_OFF";
      const discount_value = promo.discount_percentage.toString();
      
      // Fix: Meta Offers must know what they apply to. Defaulting to all products in catalog.
      const target_selection = "ALL_PRODUCTS";

      // Escape helper to prevent CSV breaking with commas
      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;

      csv += `${escapeCsv(id)},${escapeCsv(title)},${escapeCsv(description)},${escapeCsv(coupon_codes)},${escapeCsv(start_time)},${escapeCsv(end_time)},${escapeCsv(offer_type)},${escapeCsv(discount_type)},${escapeCsv(discount_value)},${escapeCsv(target_selection)}\n`;
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
