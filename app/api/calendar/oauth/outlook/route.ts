import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/calendar/oauth/outlook — Redirects user to Microsoft OAuth consent screen.
 *
 * Required env vars:
 *   OUTLOOK_CLIENT_ID (Azure AD app registration)
 *   OUTLOOK_REDIRECT_URI
 *   OUTLOOK_TENANT_ID (use "common" for multi-tenant)
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const redirectUri = process.env.OUTLOOK_REDIRECT_URI;
  const tenantId = process.env.OUTLOOK_TENANT_ID || "common";

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Outlook OAuth not configured" },
      { status: 500 }
    );
  }

  // Request only free/busy calendar access
  const scopes = [
    "Calendars.Read",
    "User.Read",
    "offline_access",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    response_mode: "query",
    state: user.id,
  });

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
  return NextResponse.redirect(url);
}
