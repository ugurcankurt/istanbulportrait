import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle Supabase auth for all admin routes
  if (pathname.startsWith("/admin")) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: "",
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      },
    );

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Optional: redirect to login if no user and not already on login page
    if (!user && pathname !== "/admin/login") {
      // Uncomment this if you want to enforce auth in middleware
      // return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  }

  const response = intlMiddleware(request);

  // Capture Google Ads & Facebook attribution parameters as 1st-party HTTP cookies (90 days, Safari ITP safe)
  const searchParams = request.nextUrl.searchParams;
  const fbclid = searchParams.get("fbclid");
  const gclid = searchParams.get("gclid");
  const gbraid = searchParams.get("gbraid");
  const wbraid = searchParams.get("wbraid");

  const ninetyDays = 90 * 24 * 60 * 60; // 90 days in seconds
  const cookieOpts = {
    maxAge: ninetyDays,
    path: "/",
    sameSite: "lax" as const,
    httpOnly: false,
  };

  if (fbclid && /^[a-zA-Z0-9_=-]+$/.test(fbclid)) {
    response.cookies.set("_fbc", `fb.1.${Date.now()}.${fbclid}`, cookieOpts);
  }
  if (gclid && /^[a-zA-Z0-9_=-]+$/.test(gclid)) {
    response.cookies.set("gclid", gclid, cookieOpts);
  }
  if (gbraid && /^[a-zA-Z0-9_=-]+$/.test(gbraid)) {
    response.cookies.set("gbraid", gbraid, cookieOpts);
  }
  if (wbraid && /^[a-zA-Z0-9_=-]+$/.test(wbraid)) {
    response.cookies.set("wbraid", wbraid, cookieOpts);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/",
    "/(ar|en|ru|es|zh|fr|de|ro|tr)/:path*",
    "/admin/:path*",
  ],
};
