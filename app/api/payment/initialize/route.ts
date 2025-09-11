import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  PaymentError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import type { PaymentRequest } from "@/lib/iyzico";
import { initializePayment } from "@/lib/iyzico";
import { mapLocaleToIyzico } from "@/lib/iyzico-errors";
import { getPackagePricing, formatPackagePricing } from "@/lib/pricing";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { sendBookingConfirmation } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabase";
import type { PackageId } from "@/lib/validations";

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

    // Get package pricing with tax breakdown
    const packagePricing = getPackagePricing(packageId as PackageId);

    // Validate amount matches expected package price (tax-inclusive)
    if (typeof amount !== "number" || amount <= 0 || amount > 10000) {
      const amountError = new ValidationError("Invalid payment amount");
      logError(amountError, {
        ip,
        endpoint: "payment",
        amount,
        action: "amount_validation",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(amountError) },
        { status: 400 },
      );
    }

    // Validate that the provided amount matches the expected package total
    if (Math.abs(amount - packagePricing.totalPrice) > 0.01) {
      const priceError = new ValidationError(
        "Amount does not match package price",
      );
      logError(priceError, {
        ip,
        endpoint: "payment",
        providedAmount: amount,
        expectedAmount: packagePricing.totalPrice,
        packageId,
        action: "price_validation",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(priceError) },
        { status: 400 },
      );
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `💳 Payment initialization from ${ip} for package ${packageId}`,
        `\n   Base: €${packagePricing.basePrice}, Tax: €${packagePricing.taxAmount}, Total: €${packagePricing.totalPrice}`,
      );
    }

    // Generate unique conversation ID for this payment attempt
    const conversationId = `payment_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Format price with proper decimal handling (max 2 decimal places)
    const formattedPrice = parseFloat(amount.toString()).toFixed(2);

    // Prepare Iyzico payment request with locale support
    const iyzicoLocale = mapLocaleToIyzico(locale || "en");
    const paymentRequest: PaymentRequest = {
      conversationId,
      price: formattedPrice,
      paidPrice: formattedPrice,
      currency: "EUR",
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
          price: formattedPrice,
        },
      ],
    };

    // Initialize payment with Iyzico
    const paymentResult = await initializePayment(paymentRequest);

    const duration = Date.now() - startTime;

    if (paymentResult.status === "success") {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `✅ Payment successful in ${duration}ms:`,
          paymentResult.paymentId,
        );
      }

      return NextResponse.json({
        success: true,
        status: "success",
        paymentId: paymentResult.paymentId || `demo_${Date.now()}`,
        conversationId,
      });
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log(
          `❌ Payment failed in ${duration}ms:`,
          paymentResult.errorMessage,
        );
      }

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
