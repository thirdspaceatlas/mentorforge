import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/calendar/oauth/google — Redirects user to Google OAuth consent screen.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_REDIRECT_URI (e.g. https://yourapp.com/api/calendar/oauth/google/callback)
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/app/onboarding?calendar=connected";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  // Request only free/busy access — we never read event titles or details
  const scopes = [
    "https://www.googleapis.com/auth/calendar.freebusy",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",      // get refresh token
    prompt: "consent",           // always show consent to ensure refresh token
    state: Buffer.from(JSON.stringify({ userId: user.id, returnTo })).toString("base64"),
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return NextResponse.redirect(url);
}
