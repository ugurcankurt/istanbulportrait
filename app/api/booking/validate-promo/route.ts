import { NextResponse } from "next/server";
import { promoService } from "@/lib/promo-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { valid: false, error: "Promo code is required" },
      { status: 400 }
    );
  }

  try {
    const promo = await promoService.validate(code);

    if (promo) {
      return NextResponse.json({
        valid: true,
        code: promo.code,
        discount_percentage: promo.discount_percentage,
      });
    } else {
      return NextResponse.json(
        { valid: false, error: "Invalid, expired, or fully used promo code" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Promo code validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
