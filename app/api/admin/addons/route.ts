import { NextResponse } from "next/server";
import { isServerAdmin } from "@/lib/auth-server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    if (!(await isServerAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    if (!(await isServerAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
