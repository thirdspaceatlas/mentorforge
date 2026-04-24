import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/calendar/crypto";
import { getUserPlan, canUseFeature } from "@/lib/access";

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
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !stateRaw) {
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  // Decode state: { userId, returnTo }
  let stateUserId: string;
  let returnTo = "/app/onboarding?calendar=connected";
  try {
    const parsed = JSON.parse(Buffer.from(stateRaw, "base64").toString());
    stateUserId = parsed.userId;
    if (parsed.returnTo) returnTo = parsed.returnTo;
  } catch {
    // Backwards compat: state might be a plain userId string
    stateUserId = stateRaw;
  }

  // Verify the user is still authenticated and matches the state
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== stateUserId) {
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

  if (!profileRes.ok) {
    console.error(JSON.stringify({ event: "google_profile_fetch_failed", status: profileRes.status }));
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  const profile = await profileRes.json();
  const providerEmail = profile.email;

  if (!providerEmail) {
    console.error(JSON.stringify({ event: "google_profile_no_email" }));
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  // Phase 1b cap: free users may connect 1 calendar. A re-auth of an existing row
  // (same provider + email) is always allowed — we only gate a brand-new connection.
  const existing = await prisma.calendarConnection.findUnique({
    where: {
      userId_provider_providerEmail: {
        userId: user.id,
        provider: "google",
        providerEmail
      }
    },
    select: { id: true }
  });

  if (!existing) {
    const userPlan = await getUserPlan(user.id);
    const capCheck = await canUseFeature(user.id, userPlan.plan, "add_calendar");
    if (!capCheck.allowed) {
      const capUrl = new URL(returnTo, req.url);
      capUrl.searchParams.set("cap", "calendar");
      capUrl.searchParams.set("used", String(capCheck.used));
      capUrl.searchParams.set("limit", String(capCheck.cap));
      return NextResponse.redirect(capUrl);
    }
  }

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

  const successUrl = new URL(returnTo, req.url);
  successUrl.searchParams.set("calendar", "connected");
  successUrl.searchParams.set("provider", "google");
  return NextResponse.redirect(successUrl);
}
