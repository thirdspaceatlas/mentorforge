import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler for Supabase PKCE flow.
 *
 * After the user completes OAuth with Google/Microsoft, Supabase redirects
 * them here with `?code=...`. We exchange that code for a session (which sets
 * the session cookies) and then redirect to the intended destination.
 *
 * Without this handler, OAuth users get an auth.users row but no session is
 * established — they appear logged out despite a successful OAuth dance.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app";
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (errorParam) {
    console.error("[auth/callback] OAuth error:", errorParam, errorDescription);
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "oauth_failed");
    if (errorDescription) loginUrl.searchParams.set("reason", errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "oauth_missing_code");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error);
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("error", "oauth_exchange_failed");
    loginUrl.searchParams.set("reason", error.message);
    return NextResponse.redirect(loginUrl);
  }

  // Only allow same-origin redirects to prevent open-redirect attacks
  const safeNext = next.startsWith("/") ? next : "/app";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
