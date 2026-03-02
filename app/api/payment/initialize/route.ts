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
import { getPackagePricing } from "@/lib/pricing";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import type { PackageId } from "@/lib/validations";
import { calculateDiscountedPrice } from "@/lib/pricing";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting
    const ip = getClientIP(request);

    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 5, // Max 5 payment attempts per minute
    });

    if (!rateLimitResult.success) {
      logError(new Error("Payment rate limit exceeded"), {
        ip,
        endpoint: "payment",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();
    const { paymentData, customerData, amount, packageId, locale } = body;

    // Validate required fields (removed bookingId requirement)
    if (!paymentData || !customerData || !amount || !packageId) {
      const validationError = new ValidationError(
        "Missing required payment data",
      );
      logError(validationError, {
        ip,
        endpoint: "payment",
        action: "field_validation",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(validationError) },
        { status: 400 },
      );
    }

    // Get package pricing with all details including date and people count
    // to correctly calculate discounts and DEPOSIT amount
    const bookingDate = customerData.bookingDate;
    const peopleCount = customerData.peopleCount;

    const packagePricing = getPackagePricing(
      packageId as PackageId,
      undefined,
      bookingDate,
      peopleCount
    );

    // Expected amount is now the DEPOSIT AMOUNT, not total price
    const expectedPrice = packagePricing.depositAmount;

    // Allow for small rounding differences (0.01)
    if (Math.abs(amount - expectedPrice) > 0.01) {
      const priceError = new ValidationError(
        "Amount does not match required deposit amount",
      );
      logError(priceError, {
        ip,
        endpoint: "payment",
        providedAmount: amount,
        expectedAmount: expectedPrice,
        packageId,
        bookingDate,
        peopleCount,
        action: "price_validation",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(priceError) },
        { status: 400 },
      );
    }

    // Generate unique conversation ID for this payment attempt
    const conversationId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Convert EUR to TRY for iyzico payment
    const amountEUR = amount;
    const exchangeRate = await getEURtoTRYRate();
    const amountTRY = await convertEURtoTRY(amountEUR);

    // Format TRY price with proper decimal handling (max 2 decimal places)
    const formattedPriceTRY = amountTRY.toFixed(2);

    // Prepare Iyzico payment request with locale support
    const iyzicoLocale = mapLocaleToIyzico(locale || "en");
    const paymentRequest: PaymentRequest = {
      conversationId,
      price: formattedPriceTRY,
      paidPrice: formattedPriceTRY,
      currency: "TRY",
      basketId: `basket_${conversationId}`,
      locale: iyzicoLocale,
      paymentCard: {
        cardHolderName: paymentData.cardHolderName,
        cardNumber: paymentData.cardNumber,
        expireMonth: paymentData.expireMonth,
        expireYear: paymentData.expireYear,
        cvc: paymentData.cvc,
      },
      buyer: {
        id: `buyer_${conversationId}`,
        name: customerData.customerName.split(" ")[0] || "Customer",
        surname:
          customerData.customerName.split(" ").slice(1).join(" ") || "User",
        gsmNumber: customerData.customerPhone,
        email: customerData.customerEmail,
        identityNumber: process.env.IYZICO_IDENTITY_NUMBER || "11111111111", // Required by Iyzico
        registrationAddress: "Istanbul, Turkey",
        ip: ip,
        city: "Istanbul",
        country: "Turkey",
      },
      shippingAddress: {
        contactName: customerData.customerName,
        city: "Istanbul",
        country: "Turkey",
        address: "Istanbul, Turkey",
      },
      billingAddress: {
        contactName: customerData.customerName,
        city: "Istanbul",
        country: "Turkey",
        address: "Istanbul, Turkey",
      },
      basketItems: [
        {
          id: packageId,
          name: `Photography Package - ${packagePricing.displayName}`,
          category1: "Photography",
          itemType: "PHYSICAL",
          price: formattedPriceTRY,
        },
      ],
    };

    // Initialize payment with Iyzico
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
        exchangeRate,
        providerResponse: paymentResult, // Return full response for debugging/storage
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
    const paymentError = new PaymentError(
      "Payment processing failed. Please try again later.",
    );

    logError(error, {
      endpoint: "payment",
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
