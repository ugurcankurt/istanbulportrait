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
import {
    type FacebookConversionEvent,
    hashCustomerData,
    hashPhoneNumber,
    sendToFacebookConversionsAPI,
} from "@/lib/facebook";
import { logError, sanitizeErrorForProduction } from "@/lib/errors";

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
            .select("id, user_email, user_phone, user_name, package_id, total_amount, created_at, status")
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
                    action_source: "crm",
                    booking_id: b.id,
                    package_id: b.package_id,
                    amount: b.total_amount,
                    has_email: !!b.user_email,
                    has_phone: !!b.user_phone,
                    booking_date: b.created_at,
                })),
            });
        }

        // ── 2. Build CRM Purchase events ─────────────────────────────────────────
        const events: FacebookConversionEvent[] = (bookings as BookingRecord[]).map((booking) => ({
            event_name: "Purchase",
            // Use original booking time (not now) — tells Meta when purchase happened
            event_time: Math.floor(new Date(booking.created_at).getTime() / 1000),
            event_id: `crm-sync-${booking.id}`, // Stable deduplication ID
            action_source: "crm",
            user_data: {
                em: booking.user_email ? [hashCustomerData(booking.user_email)] : [],
                ph: booking.user_phone ? [hashPhoneNumber(booking.user_phone)] : [],
            },
            custom_data: {
                event_source: "crm",
                lead_event_source: "Istanbul Portrait CRM",
                content_ids: [booking.package_id],
                content_type: "photography_package",
                value: booking.total_amount,
                currency: "EUR",
                transaction_id: booking.id, // Booking UUID as transaction ID
            },
        }));

        // ── 3. Send in batches of 50 ─────────────────────────────────────────────
        let sentCount = 0;
        let failedCount = 0;
        const results: { batch: number; success: boolean; count: number; error?: string }[] = [];

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
            action_source: "crm",
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
