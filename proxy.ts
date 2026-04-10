import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./lib/supabase/env";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Stripe webhooks need a clean pass-through (raw body, no session refresh).
  if (pathname === "/api/webhooks/stripe") {
    return NextResponse.next();
  }

  let supabaseUrl: string;
  let supabaseKey: string;
  try {
    ({ url: supabaseUrl, anonKey: supabaseKey } = getSupabaseEnv());
  } catch {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and/or client API key (ANON or PUBLISHABLE)"
    );
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers }
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: { headers: request.headers }
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/app") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon\\.ico).*)"]
};
