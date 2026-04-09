import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "./crypto";

/**
 * Ensures the access token for a connection is valid.
 * Refreshes it if expired (with a 5-minute buffer).
 * Returns the decrypted access token ready for API calls.
 */
export async function getValidAccessToken(connectionId: string): Promise<string> {
  const connection = await prisma.calendarConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });

  const bufferMs = 5 * 60 * 1000;
  const isExpired = connection.tokenExpiresAt.getTime() - bufferMs < Date.now();

  if (!isExpired) {
    return decrypt(connection.accessToken);
  }

  // Token is expired or about to expire — refresh it
  const refreshToken = decrypt(connection.refreshToken);

  if (!refreshToken) {
    throw new OAuthRevokedError(
      `No refresh token for connection ${connectionId}. User needs to re-authorize.`
    );
  }

  let newTokens: { access_token: string; expires_in: number; refresh_token?: string };

  if (connection.provider === "google") {
    newTokens = await refreshGoogleToken(refreshToken);
  } else if (connection.provider === "outlook") {
    newTokens = await refreshOutlookToken(refreshToken);
  } else {
    throw new Error(`Unknown provider: ${connection.provider}`);
  }

  // Update stored tokens
  await prisma.calendarConnection.update({
    where: { id: connectionId },
    data: {
      accessToken: encrypt(newTokens.access_token),
      ...(newTokens.refresh_token && { refreshToken: encrypt(newTokens.refresh_token) }),
      tokenExpiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
    },
  });

  return newTokens.access_token;
}

async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (body.includes("invalid_grant")) {
      throw new OAuthRevokedError("Google refresh token revoked. User must re-authorize.");
    }
    throw new Error(`Google token refresh failed: ${body}`);
  }

  return res.json();
}

async function refreshOutlookToken(refreshToken: string) {
  const tenantId = process.env.OUTLOOK_TENANT_ID || "common";

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.OUTLOOK_CLIENT_ID!,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    if (body.includes("invalid_grant") || body.includes("AADSTS")) {
      throw new OAuthRevokedError("Outlook refresh token revoked. User must re-authorize.");
    }
    throw new Error(`Outlook token refresh failed: ${body}`);
  }

  return res.json();
}

/** Thrown when the user's OAuth grant has been revoked and they need to re-authorize. */
export class OAuthRevokedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthRevokedError";
  }
}
