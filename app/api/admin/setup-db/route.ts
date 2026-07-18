import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  const pkg = {
    slug: "test-package-slug-new",
    price: 150,
    original_price: null,
    is_active: true,
    sort_order: 1,
    cover_image: null,
    gallery_images: [],
    title: { en: "Test Package" },
    description: { en: "Test Desc" },
    duration: { en: "1 Hour" },
    features: { en: ["photo1", "photo2"] },
  };

  const { data, error } = await supabase
    .from("packages")
    .insert([pkg])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ 
      success: false,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      exactError: error
    });
  }

  return NextResponse.json({ success: true, data });
}
