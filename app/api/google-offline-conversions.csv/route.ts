import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient } from "@/lib/auth-server";
import { settingsService } from "@/lib/settings-service";

export async function GET(request: NextRequest) {
  try {
    // 1. HTTP Basic Authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      });
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii",
    );
    const [username, password] = credentials.split(":");

    const settings = await settingsService.getSettings();
    const expectedPassword =
      settings.google_ads_webhook_key || process.env.CUSTOM_KEY;

    if (
      !expectedPassword ||
      username !== "googleads" ||
      password !== expectedPassword
    ) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 2. Fetch converted bookings (confirmed or completed) from the last 30 days
    const supabase = await createServerAdminClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("id, user_email, user_phone, total_amount, status, updated_at")
      .in("status", ["confirmed", "completed"])
      .gte("updated_at", thirtyDaysAgo.toISOString())
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    // 3. Format as CSV (Google Ads Offline Conversions / Enhanced Conversions for Leads format)
    // Required columns generally: Email, Phone Number, Conversion Name, Conversion Time, Conversion Value, Conversion Currency
    let csvContent =
      "Email,Phone Number,Conversion Name,Conversion Time,Conversion Value,Conversion Currency\n";

    if (bookings) {
      for (const booking of bookings) {
        // Format time to YYYY-MM-DD HH:MM:SS
        const conversionTime = new Date(booking.updated_at)
          .toISOString()
          .replace("T", " ")
          .substring(0, 19);

        // Safely wrap fields in quotes to prevent CSV injection or formatting issues
        const email = `"${booking.user_email || ""}"`;
        const phone = `"${booking.user_phone || ""}"`;
        const conversionName = '"Offline Booking Confirmed"';
        const value = booking.total_amount || 0;
        const currency = '"EUR"';

        csvContent += `${email},${phone},${conversionName},"${conversionTime}",${value},${currency}\n`;
      }
    }

    // 4. Return as CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="google_offline_conversions.csv"',
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error(
      "Error generating Google Ads offline conversions CSV:",
      error,
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
