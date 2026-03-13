import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { convertEURtoTRY, getEURtoTRYRate } from "@/lib/currency";
import {
  logError,
  PaymentError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import type { PaymentRequest } from "@/lib/iyzico";
import { initializePayment } from "@/lib/iyzico";
import { mapLocaleToIyzico } from "@/lib/iyzico-errors";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const ip = getClientIP(request);

    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // Max 5 payment attempts per minute
    });

    if (!rateLimitResult.success) {
      logError(new Error("Payment rate limit exceeded"), {
        ip,
        endpoint: "prints-payment",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();
    const { paymentData, shippingDetails, amount, items, locale, shippingCost, taxCost } = body;

    if (!paymentData || !shippingDetails || !amount || !items || items.length === 0) {
      const validationError = new ValidationError("Missing required payment data");
      logError(validationError, {
        ip,
        endpoint: "prints-payment",
        action: "field_validation",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(validationError) },
        { status: 400 },
      );
    }

    const conversationId = `print_payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const amountEUR = amount;
    const exchangeRate = await getEURtoTRYRate();
    const amountTRY = await convertEURtoTRY(amountEUR);

    const formattedPriceTRY = amountTRY.toFixed(2);
    const iyzicoLocale = mapLocaleToIyzico(locale || "en");

    const basketItems = await Promise.all(items.map(async (item: any, index: number) => ({
      id: item.sku || `print_${index}`,
      name: `Print - ${item.name}`,
      category1: "Physical Prints",
      itemType: "PHYSICAL",
      price: (await convertEURtoTRY(item.price * item.quantity)).toFixed(2),
    })));

    // Add shipping as a separate item if provided
    if (shippingCost && shippingCost > 0) {
      basketItems.push({
        id: "shipping_fee",
        name: "Shipping Cost",
        category1: "Shipping",
        itemType: "PHYSICAL",
        price: (await convertEURtoTRY(shippingCost)).toFixed(2),
      });
    }

    // Add tax as a separate item if provided
    if (taxCost && taxCost > 0) {
      basketItems.push({
        id: "tax_fee",
        name: "Taxes",
        category1: "Tax",
        itemType: "PHYSICAL",
        price: (await convertEURtoTRY(taxCost)).toFixed(2),
      });
    }

    // Calculate total basket items price and compare with amountTRY
    let basketTotalTRY = basketItems.reduce((acc: number, item: any) => acc + parseFloat(item.price), 0);
    
    // Safety check for tiny rounding discrepancies
    if (Math.abs(amountTRY - basketTotalTRY) > 0.01) {
       const difference = amountTRY - basketTotalTRY;
       // Adjust the last item or add a adjustment item to ensure it matches perfectly
       if (basketItems.length > 0) {
         const lastItem = basketItems[basketItems.length - 1];
         const adjustedPrice = (parseFloat(lastItem.price) + difference).toFixed(2);
         lastItem.price = adjustedPrice;
       }
    }

    // Ensure total sum matches EXACTLY formattedPriceTRY string to avoid Iyzico errors
    const finalBasketTotal = basketItems.reduce((acc: number, item: any) => acc + parseFloat(item.price), 0);
    const finalFormattedPriceTRY = finalBasketTotal.toFixed(2);

    const paymentRequest: PaymentRequest = {
      conversationId,
      price: finalFormattedPriceTRY,
      paidPrice: finalFormattedPriceTRY,
      currency: "TRY",
      basketId: `basket_${conversationId}`,
      locale: iyzicoLocale,
      paymentCard: {
        cardHolderName: paymentData.cardHolderName,
        cardNumber: paymentData.cardNumber?.replace(/\s+/g, "") || paymentData.cardNumber,
        expireMonth: paymentData.expireMonth,
        expireYear: paymentData.expireYear,
        cvc: paymentData.cvc,
      },
      buyer: {
        id: `buyer_${conversationId}`,
        name: shippingDetails.firstName || "Customer",
        surname: shippingDetails.lastName || "User",
        gsmNumber: "+905555555555", // default if not collected
        email: shippingDetails.email,
        identityNumber: process.env.IYZICO_IDENTITY_NUMBER || "11111111111",
        registrationAddress: shippingDetails.addressLine1 || "Istanbul",
        ip: ip,
        city: shippingDetails.city || "Istanbul",
        country: shippingDetails.countryCode || "TR",
      },
      shippingAddress: {
        contactName: `${shippingDetails.firstName} ${shippingDetails.lastName}`.trim(),
        city: shippingDetails.city || "Istanbul",
        country: shippingDetails.countryCode || "TR",
        address: `${shippingDetails.addressLine1} ${shippingDetails.addressLine2 || ""}`.trim(),
      },
      billingAddress: {
        contactName: `${shippingDetails.firstName} ${shippingDetails.lastName}`.trim(),
        city: shippingDetails.city || "Istanbul",
        country: shippingDetails.countryCode || "TR",
        address: `${shippingDetails.addressLine1} ${shippingDetails.addressLine2 || ""}`.trim(),
      },
      basketItems,
    };

    const paymentResult = await initializePayment(paymentRequest);
    const _duration = Date.now() - startTime;

    if (paymentResult.status === "success") {
      return NextResponse.json({
        success: true,
        status: "success",
        paymentId: paymentResult.paymentId || `demo_${Date.now()}`,
        conversationId,
        amountEUR,
        amountTRY,
        providerResponse: paymentResult,
      });
    } else {
      return NextResponse.json({
        success: false,
        status: "failure",
        errorMessage: paymentResult.errorMessage || "Payment failed",
        errorCode: paymentResult.errorCode,
      });
    }
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const paymentError = new PaymentError("Payment processing failed. Please try again later.");

    logError(error, {
      endpoint: "prints-payment",
      duration,
      action: "unexpected_error",
    });

    return NextResponse.json(
      {
        error: sanitizeErrorForProduction(paymentError),
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 },
    );
  }
}
