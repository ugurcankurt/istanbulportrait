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

  // Capture Google Ads attribution parameters from query params and set them via HTTP response headers
  // This produces first-party server cookies that Safari ITP cannot downgrade to 7 days / 24 hours.
  const searchParams = request.nextUrl.searchParams;
  const gclid = searchParams.get("gclid");
  const gbraid = searchParams.get("gbraid");
  const wbraid = searchParams.get("wbraid");
  const gadSource = searchParams.get("gad_source");
  const fbclid = searchParams.get("fbclid");

  const ninetyDays = 90 * 24 * 60 * 60; // 90 days in seconds

  if (gclid) {
    response.cookies.set("gads_gclid", gclid, {
      maxAge: ninetyDays,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
    response.cookies.set("_gcl_aw", `GCL.${Date.now()}.${gclid}`, {
      maxAge: ninetyDays,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }

  if (gbraid) {
    response.cookies.set("gads_gbraid", gbraid, {
      maxAge: ninetyDays,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }

  if (wbraid) {
    response.cookies.set("gads_wbraid", wbraid, {
      maxAge: ninetyDays,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }

  if (gadSource) {
    response.cookies.set("gads_gad_source", gadSource, {
      maxAge: ninetyDays,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }

  if (fbclid) {
    response.cookies.set("_fbc", `fb.1.${Date.now()}.${fbclid}`, {
      maxAge: ninetyDays,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
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
