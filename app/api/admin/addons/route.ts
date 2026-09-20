import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("addons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching addons:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { data, error } = await supabaseAdmin
      .from("addons")
      .insert([
        {
          slug: json.slug,
          title: json.title,
          description: json.description,
          price: json.price,
          is_per_person: json.is_per_person || false,
          is_active: json.is_active !== undefined ? json.is_active : true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error creating addon:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
