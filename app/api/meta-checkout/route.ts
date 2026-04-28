import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Meta passes ?products=ID:QTY,ID2:QTY2&coupon=CODE
  const searchParams = request.nextUrl.searchParams;
  const products = searchParams.get("products");
  const coupon = searchParams.get("coupon");

  // Fallback default language
  const defaultLocale = "en";

  if (!products) {
    // If no products, just redirect to packages page
    return NextResponse.redirect(new URL(`/${defaultLocale}/packages`, request.url));
  }

  try {
    const productEntries = products.split(",");
    const firstProduct = productEntries[0].split(":");
    const packageId = firstProduct[0];

    // Build redirect URL to package page so user can pick date/time
    // The ?book=true parameter will automatically open the booking modal
    const checkoutUrl = new URL(`/${defaultLocale}/packages/${packageId}`, request.url);
    checkoutUrl.searchParams.set("book", "true");
    
    // Pass the coupon to the package page so it can be auto-applied during checkout
    if (coupon) {
      checkoutUrl.searchParams.set("coupon", coupon);
    }

    return NextResponse.redirect(checkoutUrl);
  } catch (error) {
    console.error("Failed to parse Meta checkout URL:", error);
    return NextResponse.redirect(new URL(`/${defaultLocale}/packages`, request.url));
  }
}
