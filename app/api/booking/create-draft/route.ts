import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
    DatabaseConnectionError,
    handleSupabaseError,
    logError,
    sanitizeErrorForProduction,
    ValidationError,
} from "@/lib/errors";
import {
    checkRateLimit,
    createRateLimitError,
    getClientIP,
} from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase";
import { baseBookingSchema, packagePrices } from "@/lib/validations";
import { calculateDiscountedPrice } from "@/lib/pricing";
import { z } from "zod";

// Extended schema to include locale
const draftSchema = baseBookingSchema.extend({
    locale: z.string().default("en"),
}).refine(
    (data) => {
        // Rooftop package requires peopleCount
        if (data.packageId === "rooftop") {
            return data.peopleCount !== undefined && data.peopleCount >= 1 && data.peopleCount <= 10;
        }
        return true;
    },
    {
        message: "validation.people_count_required",
        path: ["peopleCount"],
    }
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
                { error: "Invalid request data", details: validationResult.error.issues },
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
                .upsert({
                    email: customerEmail,
                    name: customerName,
                    phone: customerPhone,
                }, { onConflict: "email" })
                .select()
                .single();

            if (customerError) {
                logError(handleSupabaseError(customerError), { action: "draft_customer_upsert" });
                // Proceed anyway
            }

            // 2. Create Draft Booking
            const { data: booking, error } = await supabaseAdmin
                .from("bookings")
                .insert({
                    package_id: packageId,
                    user_name: customerName,
                    user_email: customerEmail,
                    user_phone: customerPhone,
                    booking_date: bookingDate,
                    booking_time: bookingTime,
                    status: "draft", // IMPORTANT: Draft status
                    total_amount:
                        packageId === "rooftop" && peopleCount && peopleCount > 1
                            ? calculateDiscountedPrice(packagePrices[packageId as keyof typeof packagePrices], bookingDate).price * peopleCount
                            : calculateDiscountedPrice(packagePrices[packageId as keyof typeof packagePrices], bookingDate).price,
                    notes: notes || null,
                    locale: locale, // Save language preference
                    abandoned_email_sent: false,
                    people_count: packageId === "rooftop" ? peopleCount : null, // Only for rooftop
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({
                success: true,
                bookingId: booking.id,
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
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
