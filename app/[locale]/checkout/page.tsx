import { Suspense } from "react";
import { BookingSuccess } from "@/components/booking-success";


export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const bookingId =
    typeof resolvedSearchParams.bookingId === "string"
      ? resolvedSearchParams.bookingId
      : undefined;

  if (!bookingId) {
    return (
      <div className="flex flex-col h-dvh bg-background items-center justify-center">
        <p className="text-muted-foreground text-lg text-center">
          No booking ID provided. The booking may have been completed successfully but the ID is missing.
        </p>
      </div>
    );
  }

  const { createServerSupabaseAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return (
      <div className="flex flex-col h-dvh bg-background items-center justify-center">
        <p className="text-muted-foreground text-lg text-center">
          Booking not found or could not be loaded. Please contact support.
        </p>
      </div>
    );
  }

  const confirmedBookingData = {
    id: booking.id,
    packageId: booking.package_id,
    customerName: booking.user_name,
    customerEmail: booking.user_email,
    customerPhone: booking.user_phone,
    bookingDate: booking.booking_date,
    bookingTime: booking.booking_time,
    totalAmount: booking.total_amount,
    status: booking.status,
    peopleCount: booking.people_count,
    notes: booking.notes || null,
  };

  return (
    <Suspense fallback={<div className="h-dvh flex flex-col items-center justify-center space-y-4 animate-pulse"><div className="w-16 h-16 rounded-full bg-primary/20"></div><p className="text-muted-foreground">Loading booking...</p></div>}>
      <BookingSuccess bookingId={booking.id} packageId={booking.package_id as any} confirmedBooking={confirmedBookingData} />
    </Suspense>
  );
}