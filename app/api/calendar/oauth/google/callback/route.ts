import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/calendar/crypto";

/**
 * GET /api/calendar/oauth/google/callback — Handles Google OAuth code exchange.
 *
 * Query params (from Google):
 *   code — authorization code
 *   state — user ID (passed through from initiation)
 *
 * Exchanges code for tokens, encrypts them, stores the connection.
 * Redirects to /app/onboarding on success, /app/onboarding?error=oauth on failure.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  // Verify the user is still authenticated and matches the state
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Google token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokens;

  if (!access_token) {
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  // Get user's email from Google
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = profileRes.ok ? await profileRes.json() : { email: "unknown" };
  const providerEmail = profile.email || "unknown";

  // Encrypt tokens before storing
  const encryptedAccess = encrypt(access_token);
  const encryptedRefresh = refresh_token ? encrypt(refresh_token) : encrypt("");
  const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

  // Upsert connection (same user + provider + email = update tokens)
  await prisma.calendarConnection.upsert({
    where: {
      userId_provider_providerEmail: {
        userId: user.id,
        provider: "google",
        providerEmail,
      },
    },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiresAt,
      enabled: true,
    },
    create: {
      userId: user.id,
      provider: "google",
      providerEmail,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiresAt,
      scopes: "calendar.freebusy userinfo.email",
      enabled: true,
    },
  });

  // Redirect back to onboarding (step 4 — after calendar connect)
  return NextResponse.redirect(new URL("/app/onboarding?calendar=connected", req.url));
}
