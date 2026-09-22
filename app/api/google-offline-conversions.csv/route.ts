import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerAdminClient } from "@/lib/auth-server";
import { settingsService } from "@/lib/settings-service";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizeE164Phone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    // 1. HTTP Basic Authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Basic ")) {
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
      .select(
        "id, user_email, user_phone, total_amount, status, updated_at, gclid, gbraid, wbraid, ip_address",
      )
      .in("status", ["confirmed", "completed"])
      .gte("updated_at", thirtyDaysAgo.toISOString())
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Google Ads Official Offline Conversion Format with Enhanced Conversions (SHA-256):
    // Columns: Google Click ID,Email,Phone Number,Conversion Name,Conversion Time,Conversion Value,Conversion Currency,Transaction ID,Ad User Data Consent,Ad Personalization Consent,GBRAID,WBRAID
    let csvContent =
      "Google Click ID,Email,Phone Number,Conversion Name,Conversion Time,Conversion Value,Conversion Currency,Transaction ID,Ad User Data Consent,Ad Personalization Consent,GBRAID,WBRAID\n";

    if (bookings) {
      const conversionName = '"Purchase"';

      for (const booking of bookings) {
        // Format time to YYYY-MM-DD HH:MM:SS+00:00 ISO with explicit UTC offset
        const d = new Date(booking.updated_at);
        const pad = (n: number) => n.toString().padStart(2, "0");
        const conversionTime = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+00:00`;

        // Hash email & phone with SHA-256 per Google Ads Enhanced Conversions requirements
        const rawEmail = booking.user_email?.trim().toLowerCase();
        const email = rawEmail ? `"${sha256(rawEmail)}"` : '""';

        let phone = '""';
        if (booking.user_phone) {
          const normPhone = normalizeE164Phone(booking.user_phone);
          phone = `"${sha256(normPhone)}"`;
        }

        const gclid = booking.gclid ? `"${booking.gclid}"` : '""';
        const value = booking.total_amount || 0;
        const currency = '"EUR"';
        const transactionId = `"${booking.id}"`;
        const adUserDataConsent = '"GRANTED"';
        const adPersonalizationConsent = '"GRANTED"';
        const gbraid = booking.gbraid ? `"${booking.gbraid}"` : '""';
        const wbraid = booking.wbraid ? `"${booking.wbraid}"` : '""';

        csvContent += `${gclid},${email},${phone},${conversionName},"${conversionTime}",${value},${currency},${transactionId},${adUserDataConsent},${adPersonalizationConsent},${gbraid},${wbraid}\n`;
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
