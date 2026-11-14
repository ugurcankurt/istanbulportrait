import { NextResponse } from "next/server";
import { getGalleryFilesGrouped } from "@/lib/google-drive";
import {
  sendFinalEditsReadyEmail,
  sendRawPhotosReadyEmail,
} from "@/lib/resend";
import { settingsService } from "@/lib/settings-service";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function getNewestCreatedTime(
  files: Array<{ createdTime?: string | null }>,
): number | null {
  let newest: number | null = null;
  for (const file of files) {
    if (!file?.createdTime) continue;
    const ts = new Date(file.createdTime).getTime();
    if (Number.isFinite(ts) && (newest === null || ts > newest)) {
      newest = ts;
    }
  }
  return newest;
}

interface DriveNotificationBooking {
  id: string;
  drive_folder_id: string;
  payment_metadata?: {
    notifications?: {
      raw_sent?: boolean;
      final_sent?: boolean;
    };
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

async function processDriveNotificationForBooking(
  booking: DriveNotificationBooking,
  settings: Awaited<ReturnType<typeof settingsService.getSettings>>,
  cooldownMs: number,
): Promise<number> {
  const metadata = booking.payment_metadata || {};
  const notifications = { ...(metadata.notifications || {}) };

  const rawSent = notifications.raw_sent === true;
  const finalSent = notifications.final_sent === true;

  if (rawSent && finalSent) return 0;

  const groupedFiles = await getGalleryFilesGrouped(booking.drive_folder_id);
  let updateMetadata = false;
  let emailsSent = 0;

  // 1. Check RAW photos
  if (!rawSent && groupedFiles.raw && groupedFiles.raw.length > 0) {
    const newestRawTime = getNewestCreatedTime(groupedFiles.raw);
    if (newestRawTime !== null && Date.now() - newestRawTime > cooldownMs) {
      await sendRawPhotosReadyEmail(booking, settings);
      notifications.raw_sent = true;
      updateMetadata = true;
      emailsSent++;
    }
  }

  // 2. Check FINAL EDITS photos
  if (!finalSent && groupedFiles.final && groupedFiles.final.length > 0) {
    const newestFinalTime = getNewestCreatedTime(groupedFiles.final);
    if (newestFinalTime !== null && Date.now() - newestFinalTime > cooldownMs) {
      await sendFinalEditsReadyEmail(booking, settings);
      notifications.final_sent = true;
      updateMetadata = true;
      emailsSent++;
    }
  }

  if (updateMetadata) {
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        payment_metadata: {
          ...metadata,
          notifications,
        },
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error(
        `Failed to update DB after sending emails for booking ${booking.id}:`,
        updateError,
      );
    }
  }

  return emailsSent;
}

export async function GET(request: Request) {
  try {
    // Basic verification for Vercel Cron (fail-closed)
    const authHeader = request.headers.get("authorization");
    if (
      !process.env.CRON_SECRET ||
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await settingsService.getSettings();

    // Proceed only if Resend is configured
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "demo-resend-key") {
      return NextResponse.json({
        skipped: true,
        reason: "Resend API key not configured",
      });
    }

    // Fetch confirmed or completed bookings from the last 60 days
    // that have a drive_folder_id linked.
    const sixtyDaysAgo = new Date(
      Date.now() - 60 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .in("status", ["confirmed", "completed"])
      .not("drive_folder_id", "is", null)
      .gt("created_at", sixtyDaysAgo);

    if (fetchError) {
      console.error(
        "Failed to fetch bookings for drive notifications:",
        fetchError,
      );
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "No eligible bookings found",
      });
    }

    // Pre-filter out bookings that already have both raw_sent and final_sent true
    const bookingRows = (bookings as DriveNotificationBooking[] | null) || [];
    const pendingBookings = bookingRows.filter((booking) => {
      const notifications = booking.payment_metadata?.notifications || {};
      return !(
        notifications.raw_sent === true && notifications.final_sent === true
      );
    });

    if (pendingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        processedEmails: 0,
        totalChecked: 0,
        message: "All eligible bookings already notified",
      });
    }

    let successCount = 0;

    // We want to ensure at least 15 minutes have passed since the LAST file was uploaded
    // to prevent sending emails during a partial upload.
    const UPLOAD_COOL_DOWN_MS = 15 * 60 * 1000;
    const BATCH_SIZE = 5;

    for (let i = 0; i < pendingBookings.length; i += BATCH_SIZE) {
      const batch = pendingBookings.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((booking) =>
          processDriveNotificationForBooking(
            booking,
            settings,
            UPLOAD_COOL_DOWN_MS,
          ),
        ),
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === "fulfilled") {
          successCount += result.value;
        } else {
          console.error(
            `Failed processing drive notifications for booking ${batch[j].id}:`,
            result.reason,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedEmails: successCount,
      totalChecked: pendingBookings.length,
    });
  } catch (error) {
    console.error("CRON Error processing drive notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
