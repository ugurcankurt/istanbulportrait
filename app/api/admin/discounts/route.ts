import { NextResponse } from "next/server";
import { getAdminErrorStatus, requireServerAdmin } from "@/lib/auth-server";
import { sanitizeErrorForProduction } from "@/lib/errors";
import { revalidatePublicDiscountsCache } from "@/lib/public-cache";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    await requireServerAdmin();

    const { data, error } = await supabaseAdmin
      .from("discounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: getAdminErrorStatus(error) },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireServerAdmin();

    const { name, discount_percentage, is_active, start_date, end_date } =
      await req.json();

    const { data, error } = await supabaseAdmin
      .from("discounts")
      .insert([{ name, discount_percentage, is_active, start_date, end_date }])
      .select()
      .single();

    if (error) throw error;
    revalidatePublicDiscountsCache();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: getAdminErrorStatus(error) },
    );
  }
}
