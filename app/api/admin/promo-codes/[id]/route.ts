import { NextResponse } from "next/server";
import { createServerSupabaseAdminClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Await params correctly per Next 15+ constraints
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = await request.json();
    const supabase = await createServerSupabaseAdminClient();

    // Normalize code text
    if (body.code) body.code = body.code.trim().toUpperCase();

    const { data, error } = await supabase
      .from("promo_codes")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating promo code:", error);
    return NextResponse.json({ error: "Failed to update promo code" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const supabase = await createServerSupabaseAdminClient();

    const { error } = await supabase
      .from("promo_codes")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting promo code:", error);
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 });
  }
}
