import { Suspense } from "react";
import { getConsentCookie } from "@/app/actions/consent";
import { BookingSuccess } from "@/components/booking-success";
import { SuccessTracker } from "@/components/success-tracker";

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
          No booking ID provided. The booking may have been completed
          successfully but the ID is missing.
        </p>
      </div>
    );
  }

  const { createServerSupabaseAdminClient } = await import(
    "@/lib/supabase/server"
  );
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

  // Fetch package name for accurate GA4 tracking
  const { data: packageData } = await supabase
    .from("packages")
    .select("title")
    .eq("slug", booking.package_id)
    .single();

  const localeKey = booking.locale || "en";
  const packageName = packageData?.title?.[localeKey] || packageData?.title?.en || booking.package_id;

  const consentData = await getConsentCookie();
  const analyticsUserId =
    consentData?.consent === "accepted_all" ? booking.user_id || null : null;

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

  const isRecentBooking =
    new Date().getTime() - new Date(booking.created_at).getTime() <
    10 * 60 * 1000;

  return (
    <>
      {/* Fire purchase tracking on direct URL access only if it's a very recent booking */}
      {isRecentBooking && (
        <SuccessTracker
        bookingId={booking.id}
        packageId={booking.package_id}
        totalAmount={booking.total_amount}
        customerEmail={booking.user_email}
        customerPhone={booking.user_phone}
        customerName={booking.user_name}
        bookingDate={booking.booking_date}
        packageName={packageName}
        userId={analyticsUserId}
      />
      )}
      <Suspense
        fallback={
          <div className="h-dvh flex flex-col items-center justify-center space-y-4 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-primary/20"></div>
            <p className="text-muted-foreground">Loading booking...</p>
          </div>
        }
      >
        <BookingSuccess
          bookingId={booking.id}
          // biome-ignore lint/suspicious/noExplicitAny: Type mismatch
          packageId={booking.package_id as any}
          confirmedBooking={confirmedBookingData}
        />
      </Suspense>
    </>
  );
}
