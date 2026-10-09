import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as string | null;
  const next = searchParams.get("next") ?? "/en/account/dashboard";
  const code = searchParams.get("code");

  // Modern PKCE Flow (Used for all links, including invites)
  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error("Supabase exchangeCodeForSession Error:", error.message);
    }
  }

  // Fallback for older Email OTPs (if token_hash is used instead of code)
  if (token_hash && type) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error("Supabase verifyOtp Error:", error.message);
    }
  }

  // If no valid auth method or there was an error, redirect to an error or a safe page
  // We attach a query param so the client can optionally show an error.
  const redirectUrl = new URL(next, request.url);
  redirectUrl.searchParams.set("auth_error", "invalid_or_expired_link");
  return NextResponse.redirect(redirectUrl);
}
