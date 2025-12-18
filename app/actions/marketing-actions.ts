"use server";
import { cookies } from "next/headers";
import { hashCustomerData, trackFacebookPurchase } from "@/lib/facebook";
import { supabaseAdmin } from "@/lib/supabase";

export async function reportPurchaseToFacebook(bookingId: string) {
    try {
        // 1. Get booking details from Supabase
        const { data: booking, error } = await supabaseAdmin
            .from("bookings")
            .select("*, payments(payment_id, amount, currency)")
            .eq("id", bookingId)
            .single();

        if (error || !booking) {
            console.error("Marketing: Booking not found for reporting:", bookingId);
            return { success: false };
        }

        // 2. Get cookies for advanced matching
        const cookieStore = await cookies();
        const fbc = cookieStore.get("_fbc")?.value;
        const fbp = cookieStore.get("_fbp")?.value;

        // 3. Prepare data
        const payment = booking.payments?.[0]; // Assuming first payment is the one
        const amount = payment?.amount || booking.total_amount;
        const transactionId = payment?.payment_id || booking.id;
        const hashedEmail = hashCustomerData(booking.user_email);

        // 4. Send to Facebook CAPI
        await trackFacebookPurchase(
            booking.user_email,
            booking.user_phone,
            booking.package_id,
            amount,
            transactionId,
            undefined, // eventId
            {
                fbc,
                fbp,
                externalId: hashedEmail,
            },
        );

        return { success: true };
    } catch (error) {
        console.error("Marketing: Failed to report purchase:", error);
        return { success: false };
    }
}
