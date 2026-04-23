import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { settingsService } from "@/lib/settings-service";
import { sendRawPhotosReadyEmail, sendFinalEditsReadyEmail } from "@/lib/resend";
import { getGalleryFilesGrouped } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Basic verification for Vercel Cron
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await settingsService.getSettings();

    // Proceed only if Resend is configured
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "demo-resend-key") {
      return NextResponse.json({ skipped: true, reason: "Resend API key not configured" });
    }

    // Fetch confirmed or completed bookings from the last 60 days
    // that have a drive_folder_id linked.
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: bookings, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .in("status", ["confirmed", "completed"])
      .not("drive_folder_id", "is", null)
      .gt("created_at", sixtyDaysAgo);

    if (fetchError) {
      console.error("Failed to fetch bookings for drive notifications:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No eligible bookings found" });
    }

    let successCount = 0;
    
    // We want to ensure at least 15 minutes have passed since the LAST file was uploaded
    // to prevent sending emails during a partial upload.
    const UPLOAD_COOL_DOWN_MS = 15 * 60 * 1000; 

    for (const booking of bookings) {
      try {
        // We use payment_metadata as a flexible JSONB column to store notification flags
        // since we cannot easily alter the schema to add new columns right now.
        const metadata = booking.payment_metadata || {};
        const notifications = metadata.notifications || {};
        
        const rawSent = notifications.raw_sent === true;
        const finalSent = notifications.final_sent === true;

        // If both emails have already been sent, skip this booking entirely to save API calls
        if (rawSent && finalSent) continue;

        // Fetch Google Drive state
        const groupedFiles = await getGalleryFilesGrouped(booking.drive_folder_id);

        let updateMetadata = false;

        // 1. Check RAW photos
        if (!rawSent && groupedFiles.raw && groupedFiles.raw.length > 0) {
          // Find the most recently uploaded raw file
          const newestRaw = groupedFiles.raw.reduce((latest: any, file: any) => {
            if (!latest || !latest.createdTime) return file;
            if (!file.createdTime) return latest;
            return new Date(file.createdTime) > new Date(latest.createdTime) ? file : latest;
          }, null);

          if (newestRaw && newestRaw.createdTime) {
            const timeSinceLastUpload = Date.now() - new Date(newestRaw.createdTime).getTime();
            
            // If the newest file is older than the cooldown period, we assume upload is complete
            if (timeSinceLastUpload > UPLOAD_COOL_DOWN_MS) {
              await sendRawPhotosReadyEmail(booking, settings);
              notifications.raw_sent = true;
              updateMetadata = true;
              successCount++;
            }
          }
        }

        // 2. Check FINAL EDITS photos
        if (!finalSent && groupedFiles.final && groupedFiles.final.length > 0) {
          // Find the most recently uploaded edited file
          const newestEdited = groupedFiles.final.reduce((latest: any, file: any) => {
            if (!latest || !latest.createdTime) return file;
            if (!file.createdTime) return latest;
            return new Date(file.createdTime) > new Date(latest.createdTime) ? file : latest;
          }, null);

          if (newestEdited && newestEdited.createdTime) {
            const timeSinceLastUpload = Date.now() - new Date(newestEdited.createdTime).getTime();
            
            // If the newest file is older than the cooldown period, we assume upload is complete
            if (timeSinceLastUpload > UPLOAD_COOL_DOWN_MS) {
              await sendFinalEditsReadyEmail(booking, settings);
              notifications.final_sent = true;
              updateMetadata = true;
              successCount++;
            }
          }
        }

        // Update the database if any flags changed
        if (updateMetadata) {
          metadata.notifications = notifications;
          const { error: updateError } = await supabaseAdmin
            .from("bookings")
            // @ts-ignore
            .update({ payment_metadata: metadata })
            .eq("id", booking.id);
            
          if (updateError) {
            console.error(`Failed to update DB after sending emails for booking ${booking.id}:`, updateError);
          }
        }

      } catch (err) {
        console.error(`Failed processing drive notifications for booking ${booking.id}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processedEmails: successCount, 
      totalChecked: bookings.length 
    });
  } catch (error) {
    console.error("CRON Error processing drive notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
