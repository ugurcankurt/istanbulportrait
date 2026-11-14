import { NextResponse } from "next/server";
import { packagesService } from "@/lib/packages-service";
import { sendAbandonedBookingEmail } from "@/lib/resend";
import { settingsService } from "@/lib/settings-service";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

    // We only proceed if Resend is configured
    const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === "demo-resend-key") {
      return NextResponse.json({
        skipped: true,
        reason: "Resend API key not configured",
      });
    }

    // Identify the time threshold (10 minutes ago, matching checkout hold timer)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Fetch abandoned draft bookings
    const { data, error: fetchError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      // Drafts that haven't been completed
      .eq("status", "draft")
      // Not yet emailed
      .eq("abandoned_email_sent", false)
      // Older than 10 minutes
      .lt("created_at", tenMinutesAgo)
      // Limit to 50 per run to prevent timeout/rate limits
      .limit(50);

    // Bypass TS error for missing relations in type definition
    const abandonedBookings = data as any[] | null;

    if (fetchError) {
      console.error("Failed to fetch abandoned bookings:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!abandonedBookings || abandonedBookings.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "No abandoned bookings found",
      });
    }

    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Europe/Istanbul",
    });

    const candidateEmails = Array.from(
      new Set(
        abandonedBookings
          .map((b) => b.user_email)
          .filter((email): email is string => Boolean(email)),
      ),
    );

    const [packagesList, { data: confirmedMatches }] = await Promise.all([
      packagesService.getActivePackages(),
      candidateEmails.length > 0
        ? supabaseAdmin
            .from("bookings")
            .select("user_email, booking_date")
            .in("user_email", candidateEmails)
            .in("status", ["confirmed", "completed"])
            .gte("booking_date", todayStr)
        : Promise.resolve({
            data: [] as Array<{ user_email: string; booking_date: string }>,
          }),
    ]);

    const packagesBySlug = new Map(packagesList.map((p) => [p.slug, p]));
    const confirmedKeys = new Set(
      (
        (confirmedMatches as Array<{
          user_email: string;
          booking_date: string;
        }> | null) || []
      ).map((c) => `${String(c.user_email).toLowerCase()}::${c.booking_date}`),
    );

    let successCount = 0;
    let skippedCount = 0;
    const processedIds: string[] = [];

    for (const booking of abandonedBookings) {
      try {
        const emailLower = booking.user_email
          ? String(booking.user_email).toLowerCase()
          : "";
        const isExpiredDate =
          Boolean(booking.booking_date) && booking.booking_date < todayStr;
        const alreadyConfirmedSameDay =
          Boolean(emailLower) &&
          Boolean(booking.booking_date) &&
          confirmedKeys.has(`${emailLower}::${booking.booking_date}`);

        if (!emailLower || isExpiredDate || alreadyConfirmedSameDay) {
          processedIds.push(booking.id);
          skippedCount++;
          continue;
        }

        const locale = booking.locale || "en";
        const pkg = packagesBySlug.get(booking.package_id);
        const titleMap = pkg?.title as Record<string, string> | undefined;
        const fallbackName = booking.package_id
          ? `${booking.package_id.charAt(0).toUpperCase() + booking.package_id.slice(1)} Package`
          : "Photography Package";
        const packageName = titleMap?.[locale] || titleMap?.en || fallbackName;

        // Send Email
        await sendAbandonedBookingEmail(
          {
            bookingId: booking.id,
            packageId: booking.package_id,
            packageName,
            customerName: booking.user_name,
            customerEmail: booking.user_email,
            customerPhone: booking.user_phone,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            totalAmount: booking.total_amount,
            locale,
          },
          settings,
        );

        processedIds.push(booking.id);
        successCount++;
      } catch (emailError) {
        console.error(
          `Failed to send abandoned email for booking ${booking.id}:`,
          emailError,
        );
      }
    }

    // Mark them as processed in DB
    if (processedIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("bookings")
        .update({ abandoned_email_sent: true })
        .in("id", processedIds);

      if (updateError) {
        console.error(
          "Failed to update abandoned_email_sent flag:",
          updateError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed: successCount,
      skipped: skippedCount,
      totalFound: abandonedBookings.length,
    });
  } catch (error) {
    console.error("CRON Error processing abandoned bookings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
