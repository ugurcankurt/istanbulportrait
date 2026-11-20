import { NextResponse } from "next/server";
import { getAdminErrorStatus, requireServerAdmin } from "@/lib/auth-server";
import { sanitizeErrorForProduction } from "@/lib/errors";
import { revalidatePublicDiscountsCache } from "@/lib/public-cache";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireServerAdmin();

    const body = await request.json();
    const { id } = await params;

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
    revalidatePublicDiscountsCache();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: getAdminErrorStatus(error) },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireServerAdmin();

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("discounts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    revalidatePublicDiscountsCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorForProduction(error) },
      { status: getAdminErrorStatus(error) },
    );
  }
}
