/**
 * Next.js “Proxy” (replaces deprecated `middleware.ts` in Next.js 16).
 * Runs before routes: canonical host redirect, Supabase cookie session refresh,
 * and unauthenticated `/app/*` → `/login`.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./lib/supabase/env";

function isLocalDevHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  if (!h) return false;
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "0.0.0.0") {
    return true;
  }
  // WSL mirrored networking / LAN-style dev hosts
  if (h.endsWith(".local")) return true;
  if (h.startsWith("192.168.")) return true;
  if (h.startsWith("10.")) return true;
  // 172.16.0.0/12
  if (h.startsWith("172.")) {
    const second = Number(h.split(".")[1]);
    if (!Number.isNaN(second) && second >= 16 && second <= 31) return true;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Common alias — no /signup route; bookmarks and external links should land on register.
  if (pathname === "/signup" || pathname === "/signup/") {
    return NextResponse.redirect(new URL("/register", request.url), 308);
  }

  // Canonical domain redirect. Keeps Supabase auth cookies + OAuth callbacks on one hostname.
  const canonical = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (canonical) {
    try {
      const canonicalUrl = new URL(canonical);
      const host = request.headers.get("host")?.toLowerCase();
      // Never hijack local dev / LAN previews: `.env.local` often copies production NEXT_PUBLIC_SITE_URL.
      if (host && isLocalDevHost(host)) {
        return NextResponse.next();
      }
      if (host && host !== canonicalUrl.host.toLowerCase()) {
        const url = request.nextUrl.clone();
        url.protocol = canonicalUrl.protocol;
        url.host = canonicalUrl.host;
        return NextResponse.redirect(url, 308);
      }
    } catch {
      // ignore invalid NEXT_PUBLIC_SITE_URL
    }
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
