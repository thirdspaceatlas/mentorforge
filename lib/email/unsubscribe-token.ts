import crypto from "crypto";

/**
 * HMAC-signed one-click email unsubscribe tokens.
 * Format: `base64url(payloadJson).hexHmac`
 * Payload: { u: userId, e: expMs }
 */

export type UnsubscribeTokenPayload = {
  u: string;
  e: number;
};

const DEFAULT_TTL_DAYS = 365;

function getSecret(): string {
  const secret =
    process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim() ||
    process.env.SURVEY_LINK_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error(
      "EMAIL_UNSUBSCRIBE_SECRET (or SURVEY_LINK_SECRET fallback) must be set and at least 16 chars"
    );
  }
  return secret;
}

function base64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((s.length + 2) % 4);
  return Buffer.from(padded, "base64");
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createUnsubscribeToken(
  userId: string,
  ttlDays: number = DEFAULT_TTL_DAYS
): string {
  const payload: UnsubscribeTokenPayload = {
    u: userId,
    e: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
  };
  const encoded = base64urlEncode(Buffer.from(JSON.stringify(payload)));
  const sig = sign(encoded, getSecret());
  return `${encoded}.${sig}`;
}

export type VerifyUnsubscribeResult =
  | { ok: true; payload: UnsubscribeTokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifyUnsubscribeToken(token: string | null): VerifyUnsubscribeResult {
  if (!token?.trim()) return { ok: false, reason: "malformed" };

  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };

  const encoded = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(encoded, getSecret());

  const a = Buffer.from(providedSig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: UnsubscribeTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(encoded).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (!payload.u || !payload.e) return { ok: false, reason: "malformed" };
  if (Date.now() > payload.e) return { ok: false, reason: "expired" };

  return { ok: true, payload };
}
