/**
 * Meta CRM Sync — Batch CRM Event Sender
 *
 * Sends all historical confirmed bookings to Meta Conversions API
 * as CRM Purchase events with action_source="crm".
 *
 * Meta uses these events to:
 * - Match past customers with Facebook/Instagram profiles
 * - Improve Lookalike Audience quality
 * - Train the AI model with real purchase data
 * - Optimize ads based on actual conversion patterns
 *
 * Usage:
 *   POST /api/admin/meta-crm-sync           → Sync all confirmed bookings
 *   POST /api/admin/meta-crm-sync?dry_run=true → Preview without sending
 *
 * Meta limit: max 1000 events per API call, sent in batches of 50.
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient, requireServerAdmin } from "@/lib/auth-server";
import { logError, sanitizeErrorForProduction } from "@/lib/errors";
import {
  type FacebookConversionEvent,
  hashCustomerData,
  hashPhoneNumber,
  sendToFacebookConversionsAPI,
} from "@/lib/facebook";

const BATCH_SIZE = 50; // Meta recommended batch size

interface BookingRecord {
  id: string;
  user_email: string;
  user_phone: string;
  user_name: string;
  package_id: string;
  total_amount: number;
  created_at: string;
  status: string;
  country_code?: string | null;
  ip_address?: string | null;
}

// GET = browser-friendly; POST = fetch-friendly. Both do the same thing.
export async function GET(request: NextRequest) {
  return handleSync(request);
}
export async function POST(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  try {
    await requireServerAdmin();

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get("dry_run") === "true";
    const statusFilter = searchParams.get("status") || "confirmed";

    const supabase = await createServerAdminClient();

    // ── 1. Fetch all bookings ────────────────────────────────────────────────
    let query = supabase
      .from("bookings")
      .select(
        "id, user_email, user_phone, user_name, package_id, total_amount, created_at, status, country_code, ip_address",
      )
      .not("user_email", "is", null)
      .not("user_email", "eq", "")
      .order("created_at", { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No bookings found with status: ${statusFilter}`,
        total: 0,
        sent: 0,
        failed: 0,
      });
    }

    if (dryRun) {
      // Preview mode — show what would be sent
      return NextResponse.json({
        success: true,
        dry_run: true,
        message: `Would send ${bookings.length} CRM events to Meta in ${Math.ceil(bookings.length / BATCH_SIZE)} batches`,
        total: bookings.length,
        preview: (bookings as BookingRecord[]).slice(0, 3).map((b) => ({
          event_name: "Purchase",
          action_source: "system_generated",
          booking_id: b.id,
          package_id: b.package_id,
          amount: b.total_amount,
          has_email: !!b.user_email,
          has_phone: !!b.user_phone,
          booking_date: b.created_at,
        })),
      });
    }

    // ── 2. Build CRM Lead events per Meta spec ───────────────────────────────
    // Ref: https://developers.facebook.com/docs/marketing-api/conversions-api/crm-events
    // event_name MUST be "Lead" for CRM integration
    // event_source + lead_event_source MUST be in custom_data
    // lead_id (15-17 digit number) MUST be in user_data
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;

    const events: FacebookConversionEvent[] = await Promise.all(
      (bookings as BookingRecord[]).map(async (booking) => {
        const cleanId = booking.id.replace(/[^a-zA-Z0-9_-]/g, "_");
        const rawTime = Math.floor(
          new Date(booking.created_at).getTime() / 1000,
        );
        const eventTime = rawTime < sevenDaysAgo ? sevenDaysAgo : rawTime;

        const userData: any = {};

        if (booking.user_email) {
          userData.em = [await hashCustomerData(booking.user_email)];
        }
        if (booking.user_phone) {
          userData.ph = [await hashPhoneNumber(booking.user_phone)];
        }
        if (booking.user_name) {
          const nameParts = booking.user_name.trim().split(/\s+/);
          const firstName = nameParts[0];
          const lastName =
            nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;
          if (firstName) {
            const hashedFn = await hashCustomerData(firstName);
            if (hashedFn) userData.fn = [hashedFn];
          }
          if (lastName) {
            const hashedLn = await hashCustomerData(lastName);
            if (hashedLn) userData.ln = [hashedLn];
          }
        }
        if (booking.country_code) {
          const hashedCountry = await hashCustomerData(booking.country_code);
          if (hashedCountry) userData.country = [hashedCountry];
        }
        const hashedExternalId = await hashCustomerData(booking.id);
        if (hashedExternalId) {
          userData.external_id = [hashedExternalId];
        }
        if (booking.ip_address) {
          userData.client_ip_address = booking.ip_address;
        }

        const hasValidAmount =
          typeof booking.total_amount === "number" &&
          !Number.isNaN(booking.total_amount) &&
          booking.total_amount > 0;

        return {
          event_name: "Lead", // REQUIRED: must be "Lead" for CRM events
          event_time: eventTime,
          event_id: `crmv3_${cleanId}`,
          action_source: "system_generated", // REQUIRED for CRM
          user_data: userData,
          custom_data: {
            event_source: "crm", // REQUIRED
            lead_event_source: "Istanbul Portrait CRM", // REQUIRED: CRM name
            ...(booking.package_id
              ? { content_ids: [booking.package_id], content_type: "product" }
              : {}),
            ...(hasValidAmount
              ? {
                  value: Number(booking.total_amount.toFixed(2)),
                  currency: "EUR",
                }
              : {}),
          },
        };
      }),
    );

    // ── 3. Send in batches of 50 ─────────────────────────────────────────────
    let sentCount = 0;
    let failedCount = 0;
    const results: {
      batch: number;
      success: boolean;
      count: number;
      error?: string;
    }[] = [];

    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      const result = await sendToFacebookConversionsAPI(batch);
      const batchOk = result === true;

      if (batchOk) {
        sentCount += batch.length;
      } else {
        failedCount += batch.length;
      }

      results.push({
        batch: batchNumber,
        success: batchOk,
        count: batch.length,
        error: batchOk ? undefined : String(result),
      });

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < events.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // ── 4. Return results ─────────────────────────────────────────────────────
    const firstError = results.find((r) => r.error)?.error;
    return NextResponse.json({
      success: failedCount === 0,
      message: `CRM sync complete: ${sentCount} events sent, ${failedCount} failed`,
      total: bookings.length,
      sent: sentCount,
      failed: failedCount,
      batches: results,
      action_source: "system_generated",
      ...(firstError && { error_detail: firstError }),
    });
  } catch (error) {
    logError(error instanceof Error ? error : new Error("Unknown error"), {
      endpoint: "admin/meta-crm-sync",
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
