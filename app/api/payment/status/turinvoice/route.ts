import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import { turinvoiceGetOrderStatus } from "@/lib/turinvoice";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idOrder = searchParams.get("idOrder");

    if (!idOrder) {
      const validationError = new ValidationError("Missing order ID");
      logError(validationError, {
        endpoint: "turinvoice-status",
      });

      return NextResponse.json(
        { error: sanitizeErrorForProduction(validationError) },
        { status: 400 },
      );
    }

    // Get order status from Turinvoice
    const order = await turinvoiceGetOrderStatus(Number.parseInt(idOrder, 10));

    return NextResponse.json({
      success: true,
      idOrder: order.id,
      state: order.state,
      amount: order.amount,
      currency: order.currency,
      datePay: order.datePay,
      paymentUrl: order.paymentUrl,
    });
  } catch (error: unknown) {
    logError(error, {
      endpoint: "turinvoice-status",
      action: "status_check_error",
    });

    return NextResponse.json(
      {
        error: sanitizeErrorForProduction(error),
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
