import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireServerAdmin } from "@/lib/auth-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireServerAdmin();

    const body = await request.json();
    const { id } = await params;

    // If making this one active, deactivate all others first
    if (body.is_active === true) {
      await supabaseAdmin.from("discounts").update({ is_active: false }).neq("id", id);
    }

    const { data, error } = await supabaseAdmin
      .from("discounts")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireServerAdmin();

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("discounts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
