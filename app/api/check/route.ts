import { NextResponse } from "next/server";
import { isServerAdmin } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!(await isServerAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: pErr } = await supabaseAdmin
    .from("payments")
    .select("id")
    .limit(1);
  const { data: bookings, error: bErr } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .limit(1);

  return NextResponse.json({
    payments: {
      hasTable: pErr?.code !== "42P01",
      error: pErr,
    },
    bookings: {
      columns: bookings && bookings.length > 0 ? Object.keys(bookings[0]) : [],
      error: bErr,
    },
  });
}
