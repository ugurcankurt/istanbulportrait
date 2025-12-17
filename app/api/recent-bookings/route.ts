import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const revalidate = 60; // Revalidate every 60 seconds

interface RecentBooking {
    firstName: string;
    packageId: string;
    bookingDate: string;
    createdAt: string;
}

export async function GET() {
    try {
        const { data: bookings, error } = await supabaseAdmin
            .from("bookings")
            .select("user_name, package_id, booking_date, created_at")
            .in("status", ["confirmed", "completed", "pending"])
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            return NextResponse.json({ bookings: [] }, { status: 200 });
        }

        // Transform data - only show first name for privacy
        const recentBookings: RecentBooking[] = (bookings || []).map((booking) => {
            const firstName = booking.user_name?.split(" ")[0] || "Guest";

            return {
                firstName,
                packageId: booking.package_id,
                bookingDate: booking.booking_date,
                createdAt: booking.created_at,
            };
        });

        return NextResponse.json({ bookings: recentBookings }, { status: 200 });
    } catch {
        return NextResponse.json({ bookings: [] }, { status: 200 });
    }
}
