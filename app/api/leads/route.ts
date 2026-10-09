import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

const leadSchema = z.object({
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().default(""),
  leadSource: z.string().default("website_contact"),
  rawData: z.any().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { firstName, lastName, email, phone, leadSource, rawData } =
      result.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase config for leads API");
      return NextResponse.json(
        { error: "Server Configuration Error" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase.from("leads").insert([
      {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        lead_source: leadSource,
        raw_data: rawData || {},
      },
    ]);

    if (dbError) {
      console.error("Supabase insert lead error:", dbError);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead saved successfully",
    });
  } catch (error: any) {
    console.error("API Leads Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
