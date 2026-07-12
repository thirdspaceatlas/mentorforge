/**
 * Native push via the Expo Push API. No server key required — the Expo push
 * token itself is the credential. Mirrors lib/push/vapid.ts so the notifications
 * cron can dispatch web (VAPID) and native (Expo) from one payload.
 */

import { HttpStatusError, withRetry } from "@/lib/util/retry";

export type ExpoPushPayload = {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, unknown>;
};

export type ExpoSendResult = {
  token: string;
  ok: boolean;
  /** DeviceNotRegistered → caller should delete the stored token. */
  removable: boolean;
  error?: string;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendExpoPush(
  tokens: string[],
  payload: ExpoPushPayload,
): Promise<ExpoSendResult[]> {
  if (tokens.length === 0) return [];

  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    sound: "default",
    data: { url: payload.url ?? "/app", ...(payload.data ?? {}) },
  }));

  let res: Response;
  try {
    res = await withRetry(() =>
      fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return tokens.map((token) => ({ token, ok: false, removable: false, error: msg }));
  }

  if (!res.ok) {
    const err = new HttpStatusError(`HTTP ${res.status}`, res.status);
    const msg = err.message;
    return tokens.map((token) => ({ token, ok: false, removable: false, error: msg }));
  }

  const json = (await res.json().catch(() => ({}))) as {
    data?: { status: string; message?: string; details?: { error?: string } }[];
  };
  const tickets = json.data ?? [];

  return tokens.map((token, i) => {
    const t = tickets[i];
    if (t?.status === "ok") return { token, ok: true, removable: false };
    const errCode = t?.details?.error;
    return {
      token,
      ok: false,
      removable: errCode === "DeviceNotRegistered",
      error: t?.message ?? errCode ?? "unknown",
    };
  });
}
