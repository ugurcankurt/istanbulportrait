import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  DatabaseConnectionError,
  handleSupabaseError,
  logError,
  sanitizeErrorForProduction,
  ValidationError,
} from "@/lib/errors";
import { calculateDiscountedPrice } from "@/lib/pricing";
import {
  checkRateLimit,
  createRateLimitError,
  getClientIP,
} from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { baseBookingSchema } from "@/lib/validations";
import { Resend } from "resend";
import { settingsService } from "@/lib/settings-service";

// Extended schema to include locale
const draftSchema = baseBookingSchema
  .extend({
    locale: z.string().default("en"),
  })
  .refine(
    (data) => {
      // Removed hardcoded "rooftop" check. Schema handles basic validation.
      return true;
    },
    {
      message: "validation.people_count_required",
      path: ["peopleCount"],
    },
  );

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const ip = getClientIP(request);

    // Light rate limiting for drafts
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });

    if (!rateLimitResult.success) {
      return createRateLimitError(rateLimitResult.resetTime);
    }

    const body = await request.json();
    const validationResult = draftSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const {
      packageId,
      customerName,
      customerEmail,
      customerPhone,
      bookingDate,
      bookingTime,
      notes,
      totalAmount,
      locale,
      peopleCount,
    } = validationResult.data;

    try {
      // 1. Upsert Customer
      const { error: customerError } = await supabaseAdmin
        .from("customers")
        // @ts-ignore - Bypass strict generic constraints
        .upsert(
          {
            email: customerEmail,
            name: customerName,
            phone: customerPhone,
          },
          { onConflict: "email" },
        )
        .select()
        .single();

      if (customerError) {
        logError(handleSupabaseError(customerError), {
          action: "draft_customer_upsert",
        });
        // Proceed anyway
      }

      // 2. Create Draft Booking
      const { data: booking, error } = await supabaseAdmin
        .from("bookings")
        // @ts-ignore - Bypass strict generic constraints
        .insert({
          package_id: packageId,
          user_name: customerName,
          user_email: customerEmail,
          user_phone: customerPhone,
          booking_date: bookingDate,
          booking_time: bookingTime,
          status: "draft", // IMPORTANT: Draft status
          total_amount: totalAmount,
          notes: notes || null,
          locale: locale, // Save language preference
          abandoned_email_sent: false,
          people_count: peopleCount || null,
        })
        .select()
        .single();

      if (error) throw error;

      // 3. Add to Resend Audience/Contacts if enabled
      try {
        const settings = await settingsService.getSettings();
        const apiKey = settings.resend_api_key || process.env.RESEND_API_KEY;
        const audienceId = settings.resend_audience_id;

        if (apiKey && audienceId && apiKey !== "demo-resend-key") {
          const resend = new Resend(apiKey);
          // Only use the first word as first name, the rest as last name
          const nameParts = customerName.split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

          // Perform contact creation asynchronously without blocking the user flow
          fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: customerEmail,
              first_name: firstName,
              last_name: lastName,
              unsubscribed: false
            })
          })
          .then(async (res) => {
            if (!res.ok) {
              const err = await res.text();
              console.error("Resend Contacts REST API failed:", err);
            }
          })
          .catch((err) => {
            console.error("Resend Contacts REST execution failed:", err);
          });
        }
      } catch (contactError) {
        // Silently fail setting the contact so we don't break booking flow
        console.error("Failed to add contact to Resend Audience:", contactError);
      }

      return NextResponse.json({
        success: true,
        bookingId: (booking as any).id,
      });
    } catch (dbError) {
      logError(handleSupabaseError(dbError), { action: "create_draft" });
      return NextResponse.json(
        { error: "Database error creating draft" },
        { status: 500 },
      );
    }
  } catch (error) {
    logError(error, { action: "draft_unexpected" });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
