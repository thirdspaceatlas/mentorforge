import webpush from "web-push";

/**
 * VAPID key management for web push.
 *
 * Required env vars (set in Vercel production + local `.env`):
 *   VAPID_PUBLIC_KEY           — base64url public key
 *   VAPID_PRIVATE_KEY          — base64url private key
 *   VAPID_SUBJECT              — mailto: or https:// contact for push services
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY — same as VAPID_PUBLIC_KEY, exposed to the client so the browser can subscribe
 *
 * Generate a keypair with:   npx web-push generate-vapid-keys
 */

let configured = false;

function ensureConfigured(): void {
  if (configured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT must all be set"
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Relative URL to open when the notification is clicked. Defaults to /app. */
  url?: string;
  /** Small identifier tag so duplicate nudges collapse in the system tray. */
  tag?: string;
};

export type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Send one push payload to one stored subscription.
 * Throws a typed error with `statusCode` (from web-push) so callers can
 * distinguish "gone" (410 / 404, delete the row) from transient failures.
 */
export async function sendPush(
  subscription: StoredSubscription,
  payload: PushPayload
): Promise<void> {
  ensureConfigured();

  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth }
    },
    JSON.stringify(payload),
    { TTL: 60 * 30 } // 30 min — nudges are time-sensitive; don't pile up if device is offline.
  );
}

export function isSubscriptionGone(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const status = (err as { statusCode?: number }).statusCode;
  return status === 404 || status === 410;
}
