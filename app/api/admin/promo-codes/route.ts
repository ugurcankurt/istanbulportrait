import { NextResponse } from "next/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseAdminClient();
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json({ error: "Failed to fetch promo codes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseAdminClient();
    const body = await request.json();
    
    // Normalize code text
    if (body.code) body.code = body.code.trim().toUpperCase();

    const { data, error } = await supabase
      .from("promo_codes")
      .insert([body])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating promo code:", error);
    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
  }
}
