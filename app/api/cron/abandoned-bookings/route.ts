import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { settingsService } from "@/lib/settings-service";
import { sendAbandonedBookingEmail } from "@/lib/resend";
import { getPackagePricing } from "@/lib/pricing";
import type { PackageId } from "@/lib/validations";

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
    
    // We only proceed if Resend is configured
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "demo-resend-key") {
      return NextResponse.json({ skipped: true, reason: "Resend API key not configured" });
    }

    // Identify the time threshold (2 minutes ago)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    // Fetch abandoned draft bookings
    const { data, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      // Drafts that haven't been completed
      .eq("status", "draft")
      // Not yet emailed
      .eq("abandoned_email_sent", false)
      // Older than 2 minutes
      .lt("created_at", twoMinutesAgo)
      // Limit to 50 per run to prevent timeout/rate limits
      .limit(50);

    // Bypass TS error for missing relations in type definition
    const abandonedBookings = data as any[] | null;

    if (fetchError) {
      console.error("Failed to fetch abandoned bookings:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!abandonedBookings || abandonedBookings.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No abandoned bookings found" });
    }

    let successCount = 0;
    const processedIds: string[] = [];

    for (const booking of abandonedBookings) {
      try {
        const locale = booking.locale || "en";
        // Attempt to parse multilingual package name
        let packageName = `${booking.package_id.charAt(0).toUpperCase() + booking.package_id.slice(1)} Package`;

        // Send Email
        await sendAbandonedBookingEmail(
          {
            bookingId: booking.id,
            packageId: booking.package_id,
            packageName: packageName,
            customerName: booking.user_name,
            customerEmail: booking.user_email,
            customerPhone: booking.user_phone,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            totalAmount: booking.total_amount,
            locale: locale,
          },
          settings
        );

        processedIds.push(booking.id);
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send abandoned email for booking ${booking.id}:`, emailError);
      }
    }

    // Mark them as processed in DB
    if (processedIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("bookings")
        // @ts-ignore - Bypass never type error from strict supabase generics
        .update({ abandoned_email_sent: true })
        .in("id", processedIds);

      if (updateError) {
        console.error("Failed to update abandoned_email_sent flag:", updateError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: successCount, 
      totalFound: abandonedBookings.length 
    });
  } catch (error) {
    console.error("CRON Error processing abandoned bookings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
