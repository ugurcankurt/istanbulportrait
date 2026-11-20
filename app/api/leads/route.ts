import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";

const leadSchema = z
  .object({
    firstName: z.string().trim().max(100).optional().default(""),
    lastName: z.string().trim().max(100).optional().default(""),
    email: z
      .string()
      .trim()
      .email("Invalid email format")
      .max(254)
      .optional()
      .or(z.literal("")),
    phone: z.string().trim().max(40).optional().default(""),
    leadSource: z.string().trim().max(64).default("website_contact"),
    rawData: z
      .record(
        z.string().max(64),
        z.union([z.string().max(1000), z.number(), z.boolean(), z.null()]),
      )
      .optional(),
  })
  .refine(
    (data) => Boolean(data.email || data.phone),
    "Email or phone number is required",
  );

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const { success: isAllowed, resetTime } = await checkRateLimit(
      `leads_${ip}`,
      {
        maxRequests: 10,
        windowMs: 15 * 60 * 1000,
      },
    );

    if (!isAllowed) {
      return createRateLimitError(resetTime);
    }

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

    const { error: dbError } = await supabaseAdmin.from("leads").insert([
      {
        first_name: firstName,
        last_name: lastName,
        email: email || "",
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
  } catch (error) {
    console.error("API Leads Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
