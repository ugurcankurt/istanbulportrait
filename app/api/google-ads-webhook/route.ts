import { NextResponse } from "next/server";
import { settingsService } from "@/lib/settings-service";
import { createClient } from "@supabase/supabase-js";
import { sendAdminLeadNotification } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("Google Ads Webhook Payload:", JSON.stringify(payload, null, 2));

    // Payload expected format:
    // {
    //   "lead_id": "TeSt-1ab2c3...",
    //   "user_column_data": [
    //     {"column_id": "FIRST_NAME", "string_value": "John"},
    //     {"column_id": "LAST_NAME", "string_value": "Doe"},
    //     {"column_id": "PHONE_NUMBER", "string_value": "+1234567890"},
    //     {"column_id": "EMAIL", "string_value": "john@example.com"}
    //   ],
    //   "api_version": "1.0",
    //   "form_id": 12345,
    //   "campaign_id": 67890,
    //   "google_key": "YOUR_KEY",
    //   "is_test": true
    // }

    // 1. Verify Google Key
    const settings = await settingsService.getSettings();
    const expectedKey = settings.google_ads_webhook_key;

    if (!expectedKey) {
      return NextResponse.json(
        { error: "Webhook not configured on server (Missing key in settings)" },
        { status: 500 }
      );
    }

    if (payload.google_key !== expectedKey) {
      return NextResponse.json(
        { error: "Invalid google_key" },
        { status: 401 }
      );
    }

    // 2. Parse User Data
    const columnData = payload.user_column_data || [];
    const fields: Record<string, string> = {};

    let firstName = "";
    let lastName = "";
    let email = "";
    let phone = "";

    columnData.forEach((item: any) => {
      const key = item.column_id;
      const value = item.string_value || "";
      fields[key] = value;

      if (key === "FIRST_NAME") firstName = value;
      if (key === "LAST_NAME") lastName = value;
      if (key === "EMAIL") email = value;
      if (key === "PHONE_NUMBER") phone = value;
    });

    // 3. Insert into Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // use service role directly to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("leads").insert([
      {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        raw_data: payload,
        lead_source: "google_ads",
        campaign_id: payload.campaign_id?.toString() || null,
        form_id: payload.form_id?.toString() || null,
      },
    ]);

    if (dbError) {
      console.error("Supabase leads insert error:", dbError);
      // Even if DB fails, maybe still send email, but normally we log and continue or error
    }

    // 4. Send Email Notification
    await sendAdminLeadNotification(
      {
        source: "Google Ads Lead Form",
        campaignId: payload.campaign_id?.toString(),
        formId: payload.form_id?.toString(),
        fields: fields,
      },
      settings
    );

    // Google Ads expects a 200 OK
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google Ads Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
