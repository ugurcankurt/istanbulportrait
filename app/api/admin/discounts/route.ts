import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireServerAdmin } from "@/lib/auth-server";

export async function GET() {
  try {
    await requireServerAdmin();

    const { data, error } = await supabaseAdmin
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireServerAdmin();

    const { name, discount_percentage, is_active, start_date, end_date } = await req.json();

    if (is_active) {
      // Prevent multiple active discounts by deactivating all others
      await supabaseAdmin.from("discounts").update({ is_active: false }).neq("name", "DISABLE_ALL_TRICK");
    }

    const { data, error } = await supabaseAdmin
      .from("discounts")
      .insert([{ name, discount_percentage, is_active, start_date, end_date }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
