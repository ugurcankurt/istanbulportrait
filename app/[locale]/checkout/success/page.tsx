import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { getConsentCookie } from "@/app/actions/consent";
import { BookingSuccess } from "@/components/booking-success";
import { SuccessTracker } from "@/components/success-tracker";
import { getServerUser, isServerAdmin } from "@/lib/auth-server";
import { verifyBookingToken } from "@/lib/booking-token";
import { settingsService } from "@/lib/settings-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: {
    index: false,
    follow: false,
  },
};

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
  const tokenParam =
    typeof resolvedSearchParams.token === "string"
      ? resolvedSearchParams.token
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

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(`booking_success_${bookingId}`)?.value;
  const hasValidToken =
    verifyBookingToken(bookingId, "success", tokenParam) ||
    verifyBookingToken(bookingId, "success", cookieToken);

  const { createServerSupabaseAdminClient } = await import(
    "@/lib/supabase/server"
  );
  const supabase = await createServerSupabaseAdminClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, payments(payment_id, provider, amount, status)")
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

  if (!hasValidToken) {
    const user = await getServerUser();
    const isOwner =
      user !== null &&
      ((booking.user_id && booking.user_id === user.id) ||
        (user.email &&
          booking.user_email &&
          user.email.toLowerCase() === booking.user_email.toLowerCase()));
    const isAdmin = user?.email ? await isServerAdmin(user.email) : false;

    if (!isOwner && !isAdmin) {
      return (
        <div className="flex flex-col h-dvh bg-background items-center justify-center px-4">
          <p className="text-muted-foreground text-lg text-center max-w-md">
            This booking confirmation link has expired or requires signing in to
            view your reservation details.
          </p>
        </div>
      );
    }
  }

  // Fetch package name and public contact settings
  const [{ data: packageData }, settings] = await Promise.all([
    supabase
      .from("packages")
      .select("title")
      .eq("slug", booking.package_id)
      .single(),
    settingsService.getSettings(),
  ]);

  const localeKey = booking.locale || "en";
  const packageName =
    packageData?.title?.[localeKey] ||
    packageData?.title?.en ||
    booking.package_id;

  const consentData = await getConsentCookie();
  const analyticsUserId =
    consentData?.consent === "accepted_all" ? booking.user_id || null : null;

  const firstPayment = Array.isArray(booking.payments)
    ? booking.payments[0]
    : null;

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
    paymentId:
      firstPayment?.payment_id ||
      (firstPayment?.provider === "cash" ? `cash_${booking.id}` : undefined),
    selected_addon_details: booking.selected_addon_details || [],
    applied_promo_code: booking.applied_promo_code || null,
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
          contactEmail={settings.contact_email}
          contactPhone={settings.contact_phone}
        />
      </Suspense>
    </>
  );
}
