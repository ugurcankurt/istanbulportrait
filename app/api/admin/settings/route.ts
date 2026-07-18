import { NextResponse } from "next/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("GET site_settings Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || {});
  } catch (error: any) {
    console.error("GET site_settings Unknown Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabaseAdminClient();

    // Make sure we have a baseline singleton record
    const { data: existingData } = await supabase
      .from("site_settings")
      .select("id")
      .eq("id", 1)
      .single();

    let result;
    if (!existingData) {
      result = await supabase
        .from("site_settings")
        .insert([{ id: 1, ...body }])
        .select()
        .single();
    } else {
      result = await supabase
        .from("site_settings")
        .update(body)
        .eq("id", 1)
        .select()
        .single();
    }

    if (result.error) {
      console.error("PATCH site_settings Error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("PATCH site_settings Unknown Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
