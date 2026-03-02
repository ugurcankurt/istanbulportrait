import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  logError,
  PaymentError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { turinvoiceCreateOrder } from "@/lib/turinvoice";
import { packagePrices, PackageId } from "@/lib/validations";
import { getPackagePricing } from "@/lib/pricing";

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
      logError(new Error("Turinvoice payment rate limit exceeded"), {
        ip,
        endpoint: "turinvoice-payment",
      });
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();
    const { customerData, amount, packageId, locale } = body;

    // Validate required fields
    if (!customerData || !amount || !packageId) {
      const validationError = new ValidationError(
        "Missing required payment data",
      );
      logError(validationError, {
        ip,
        endpoint: "turinvoice-payment",
        action: "field_validation",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(validationError) },
        { status: 400 },
      );
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0 || amount > 10000) {
      const amountError = new ValidationError("Invalid payment amount");
      logError(amountError, {
        ip,
        endpoint: "turinvoice-payment",
        amount,
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(amountError) },
        { status: 400 },
      );
    }

    // Validate package exists
    if (!(packageId in packagePrices)) {
      const packageError = new ValidationError("Invalid package ID");
      logError(packageError, {
        ip,
        endpoint: "turinvoice-payment",
        packageId,
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(packageError) },
        { status: 400 },
      );
    }

    // Verify price matches package DEPOSIT price
    const bookingDate = customerData?.bookingDate;
    // We generally expect peopleCount in customerData for rooftop, but it might not be there if not required or passed differently.
    // However, for correct pricing, we need it. Checking if it's in customerData.
    const peopleCount = customerData?.peopleCount;

    const packagePricing = getPackagePricing(
      packageId as PackageId,
      undefined,
      bookingDate,
      peopleCount
    );

    const expectedPrice = packagePricing.depositAmount;

    if (Math.abs(amount - expectedPrice) > 0.01) {
      const priceError = new ValidationError(
        "Amount does not match required deposit amount",
      );
      logError(priceError, {
        ip,
        endpoint: "turinvoice-payment",
        providedAmount: amount,
        expectedAmount: expectedPrice,
        packageId,
        bookingDate,
        action: "price_validation",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(priceError) },
        { status: 400 },
      );
    }

    // Validate package exists
    if (!(packageId in packagePrices)) {
      const packageError = new ValidationError("Invalid package ID");
      logError(packageError, {
        ip,
        endpoint: "turinvoice-payment",
        packageId,
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(packageError) },
        { status: 400 },
      );
    }

    // Create order name
    const orderName = `Photography ${packageId} - ${customerData.customerName}`;

    // Optional redirect URL (success page)
    const redirectURL = `${process.env.NEXT_PUBLIC_BASE_URL || "https://istanbulportrait.com"}/${locale}/checkout?success=true`;

    // Create Turinvoice order
    const turinvoiceOrder = await turinvoiceCreateOrder(
      amount,
      orderName,
      redirectURL,
    );

    const _duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      idOrder: turinvoiceOrder.id,
      paymentUrl: turinvoiceOrder.paymentUrl,
      amountEUR: turinvoiceOrder.amountEUR,
      amountTRY: turinvoiceOrder.amount,
      exchangeRate: turinvoiceOrder.exchangeRate,
      currency: turinvoiceOrder.currency,
      state: turinvoiceOrder.state,
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const paymentError = new PaymentError(
      "Turinvoice payment initialization failed. Please try again later.",
    );

    logError(error, {
      endpoint: "turinvoice-payment",
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
