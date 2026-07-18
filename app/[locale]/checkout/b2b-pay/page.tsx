import { supabaseAdmin } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { B2BClientCheckout } from "./b2b-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "B2B Payment | Istanbul Portrait",
  description: "Secure B2B payment gateway for agency partners.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function B2BPayPage({
  searchParams,
  params: { locale }
}: {
  searchParams: { bookingId?: string };
  params: { locale: string };
}) {
  const { bookingId } = searchParams;

  if (!bookingId) {
    notFound();
  }

  // Fetch the booking from database
  const { data: booking, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    notFound();
  }

  if (booking.status === "confirmed") {
    // If it's already paid and confirmed, redirect them to a success or home page
    redirect(`/${locale}/?payment=success`);
  }

  return (
    <div className="min-h-screen bg-[#050505] py-20 px-4">
      <B2BClientCheckout booking={booking} />
    </div>
  );
}
