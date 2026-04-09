import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/calendar/crypto";

/**
 * GET /api/calendar/oauth/outlook/callback — Handles Microsoft OAuth code exchange.
 *
 * Same pattern as Google callback: exchange code, encrypt tokens, store connection.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== state) {
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  const tenantId = process.env.OUTLOOK_TENANT_ID || "common";

  // Exchange code for tokens
  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.OUTLOOK_CLIENT_ID!,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
        redirect_uri: process.env.OUTLOOK_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    }
  );

  if (!tokenRes.ok) {
    console.error("Outlook token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokens;

  if (!access_token) {
    return NextResponse.redirect(new URL("/app/onboarding?error=oauth", req.url));
  }

  // Get user's email from Microsoft Graph
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const profile = profileRes.ok ? await profileRes.json() : {};
  const providerEmail = profile.mail || profile.userPrincipalName || "unknown";

  // Encrypt tokens
  const encryptedAccess = encrypt(access_token);
  const encryptedRefresh = refresh_token ? encrypt(refresh_token) : encrypt("");
  const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);

  // Upsert connection
  await prisma.calendarConnection.upsert({
    where: {
      userId_provider_providerEmail: {
        userId: user.id,
        provider: "outlook",
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
      provider: "outlook",
      providerEmail,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiresAt,
      scopes: "Calendars.Read User.Read offline_access",
      enabled: true,
    },
  });

  return NextResponse.redirect(new URL("/app/onboarding?calendar=connected", req.url));
}
