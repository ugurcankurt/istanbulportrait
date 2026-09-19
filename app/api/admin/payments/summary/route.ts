import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient, requireServerAdmin } from "@/lib/auth-server";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
} from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireServerAdmin();

    // Get admin client
    const supabase = await createServerAdminClient();

    try {
      // Fetch all successful payments
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, currency, created_at, provider_response")
        .eq("status", "success");

      if (error) {
        throw error;
      }

      // Aggregate payments by Year, Month, and Currency
      const summariesMap = new Map<string, any>();

      (payments || []).forEach((payment) => {
        const date = new Date(payment.created_at);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        const currency = payment.currency || "EUR";
        
        let amount = payment.amount || 0;
        let tryNet = 0;
        let tryVat = 0;
        let tryCommission = 0;
        let finalNetProfit = 0;

        // If currency is TRY, try to extract accurate values
        if (currency === "TRY") {
          let iyzicoFee = 0;
          if (payment.provider_response?.paidPrice) {
            amount = payment.provider_response.paidPrice;
            const fixedFee = payment.provider_response.iyziCommissionFee || 0;
            const rateAmount = payment.provider_response.iyziCommissionRateAmount || 0;
            iyzicoFee = fixedFee + rateAmount;
          }
          
          tryNet = amount / 1.2;
          tryVat = amount - tryNet;
          tryCommission = iyzicoFee;
          finalNetProfit = amount - tryVat - tryCommission;
        }

        const key = `${year}-${month}-${currency}`;

        if (!summariesMap.has(key)) {
          summariesMap.set(key, {
            year,
            month,
            currency,
            total_amount: 0,
            net_amount: 0,
            vat_amount: 0,
            commission_amount: 0,
            final_profit: 0,
            transaction_count: 0,
          });
        }

        const current = summariesMap.get(key);
        current.total_amount += amount;
        current.transaction_count += 1;

        if (currency === "TRY") {
          current.net_amount += tryNet;
          current.vat_amount += tryVat;
          current.commission_amount += tryCommission;
          current.final_profit += finalNetProfit;
        } else {
          // Approximate for EUR (Assume 20% VAT inside)
          const eurNet = amount / 1.2;
          const eurVat = amount - eurNet;
          current.net_amount += eurNet;
          current.vat_amount += eurVat;
          current.final_profit += eurNet;
        }
      });

      const summaries = Array.from(summariesMap.values()).sort((a, b) => {
        // Sort descending (newest first)
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      return NextResponse.json({
        success: true,
        summaries,
      });
    } catch (supabaseError) {
      const dbError = new DatabaseConnectionError();
      logError(handleSupabaseError(supabaseError), {
        endpoint: "admin/payments/summary",
        action: "fetch_summaries",
      });

      return NextResponse.json(
        {
          error: sanitizeErrorForProduction(dbError),
          details:
            process.env.NODE_ENV === "development"
              ? handleSupabaseError(supabaseError).message
              : undefined,
        },
        { status: 503 },
      );
    }
  } catch (error) {
    logError(error, {
      endpoint: "admin/payments/summary",
      action: "auth_or_unexpected",
    });

    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      {
        status:
          error instanceof Error &&
          error.message.includes("Admin access required")
            ? 403
            : 500,
      },
    );
  }
}
