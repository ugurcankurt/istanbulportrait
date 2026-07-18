import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { initializePayment, PaymentRequest } from "@/lib/iyzico";
import { convertEURtoTRY } from "@/lib/currency";
import { mapLocaleToIyzico } from "@/lib/iyzico-errors";

export async function POST(request: NextRequest) {
  try {
    const { bookingId, paymentData, locale } = await request.json();

    if (!bookingId || !paymentData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === "confirmed") {
      return NextResponse.json({ error: "Booking is already paid and confirmed" }, { status: 400 });
    }

    // 2. Prepare Payment
    const amountEUR = booking.total_amount;
    const amountTRY = await convertEURtoTRY(amountEUR);
    const formattedPriceTRY = amountTRY.toFixed(2);
    
    const conversationId = `b2b_${bookingId}_${Date.now()}`;
    const iyzicoLocale = mapLocaleToIyzico(locale || "en");

    const paymentRequest: PaymentRequest = {
      conversationId,
      price: formattedPriceTRY,
      paidPrice: formattedPriceTRY,
      currency: "TRY",
      basketId: `basket_${bookingId}`,
      locale: iyzicoLocale,
      paymentCard: {
        cardHolderName: paymentData.cardHolderName,
        cardNumber: paymentData.cardNumber,
        expireMonth: paymentData.expireMonth,
        expireYear: paymentData.expireYear,
        cvc: paymentData.cvc,
      },
      buyer: {
        id: `b2b_agency_${bookingId}`,
        name: "B2B",
        surname: "Agency",
        gsmNumber: "+905367093724", // Default or fallback
        email: booking.user_email || "b2b@istanbulportrait.com",
        identityNumber: "11111111111",
        registrationAddress: "Istanbul",
        ip: "8.8.8.8",
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: "B2B Agency",
        city: "Istanbul",
        country: "Turkey",
        address: "Istanbul",
      },
      billingAddress: {
        contactName: "B2B Agency",
        city: "Istanbul",
        country: "Turkey",
        address: "Istanbul",
      },
      basketItems: [
        {
          id: booking.package_id,
          name: `B2B Booking - ${booking.package_id}`,
          category1: "B2B",
          itemType: "VIRTUAL",
          price: formattedPriceTRY,
        },
      ],
    };

    const { settingsService } = await import("@/lib/settings-service");
    const settings = await settingsService.getSettings();

    // 3. Process Payment via Iyzico
    const paymentResult = await initializePayment(paymentRequest, settings);

    if (paymentResult.status === "success") {
      // 4. Mark booking as confirmed
      await supabaseAdmin
        .from("bookings")
        .update({ 
          status: "confirmed",
          payment_id: paymentResult.paymentId
        })
        .eq("id", bookingId);

      return NextResponse.json({ success: true, paymentId: paymentResult.paymentId });
    } else {
      return NextResponse.json({ 
        error: paymentResult.errorMessage || "Payment failed",
        errorCode: paymentResult.errorCode 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("B2B Payment Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
