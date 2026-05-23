import { prisma } from "@/lib/prisma";
import { decrypt } from "./crypto";

/**
 * Best-effort OAuth token revocation before account deletion.
 * Always deletes connections from our DB afterward (caller responsibility).
 */
export async function revokeCalendarOAuthTokens(userId: string): Promise<void> {
  const connections = await prisma.calendarConnection.findMany({
    where: { userId },
    select: { id: true, provider: true, refreshToken: true, accessToken: true },
  });

  await Promise.all(
    connections.map(async (conn) => {
      try {
        const refresh = decrypt(conn.refreshToken);
        const access = decrypt(conn.accessToken);
        if (conn.provider === "google") {
          await revokeGoogleToken(refresh || access);
        }
        // Microsoft does not expose a simple refresh-token revoke for all app types;
        // encrypted tokens are removed when the profile row is deleted.
      } catch (err) {
        console.warn(
          `[revoke-oauth] failed for connection ${conn.id}:`,
          err instanceof Error ? err.message : err
        );
      }
    })
  );
}

async function revokeGoogleToken(token: string): Promise<void> {
  if (!token) return;
  const body = new URLSearchParams({ token });
  const res = await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn("[revoke-oauth] Google revoke non-OK:", res.status, text.slice(0, 200));
  }
}
