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
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Decode state first to get returnTo for error redirects
  let stateUserId: string | null = null;
  let returnTo = "/app?error=oauth";
  if (stateRaw) {
    try {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64").toString());
      stateUserId = parsed.userId;
      if (parsed.returnTo) returnTo = parsed.returnTo;
    } catch {
      stateUserId = stateRaw;
    }
  }

  const errorUrl = (reason: string) => {
    const u = new URL(returnTo.split("?")[0] || "/app", req.url);
    u.searchParams.set("error", "oauth");
    u.searchParams.set("reason", reason);
    return u;
  };

  if (error || !code || !stateRaw) {
    console.error("Outlook OAuth error:", error);
    return NextResponse.redirect(errorUrl(error || "missing_params"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== stateUserId) {
    console.error("Outlook OAuth state mismatch:", { userId: user?.id, stateUserId });
    return NextResponse.redirect(errorUrl("state_mismatch"));
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
    const errBody = await tokenRes.text();
    console.error("Outlook token exchange failed:", errBody);
    return NextResponse.redirect(errorUrl("token_exchange"));
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokens;

  if (!access_token) {
    console.error("Outlook token exchange returned no access_token");
    return NextResponse.redirect(errorUrl("no_access_token"));
  }

  // Get user's email from Microsoft Graph
  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileRes.ok) {
    console.error("Outlook profile fetch failed:", profileRes.status);
    return NextResponse.redirect(errorUrl("profile_fetch"));
  }

  const profile = await profileRes.json();
  const providerEmail = profile.mail || profile.userPrincipalName;

  if (!providerEmail) {
    console.error("Outlook profile has no email");
    return NextResponse.redirect(errorUrl("no_email"));
  }

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

  const successUrl = new URL(returnTo, req.url);
  successUrl.searchParams.set("calendar", "connected");
  successUrl.searchParams.set("provider", "outlook");
  return NextResponse.redirect(successUrl);
}
