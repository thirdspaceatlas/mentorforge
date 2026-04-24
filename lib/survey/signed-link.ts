import crypto from "crypto";

/**
 * HMAC-signed, self-contained survey reply tokens.
 * Clicking a digest option takes the user to `/api/survey/answer?t=<token>`
 * which verifies the signature and writes a UserSurveyResponse row.
 *
 * Token format: `base64url(payloadJson).hexHmac`
 * Payload     : { u: userId, q: questionId, a: answerKey, e: expMs }
 *
 * Uses `SURVEY_LINK_SECRET` as the HMAC key. Falls back to `NEXTAUTH_SECRET`
 * or `SUPABASE_JWT_SECRET` if set — any stable server-side 32+ byte secret
 * is fine; the important thing is that clients never see it.
 */

export type SurveyTokenPayload = {
  u: string; // userId (uuid)
  q: string; // question id
  a: string; // answer key
  e: number; // expiry (ms since epoch)
};

const DEFAULT_TTL_DAYS = 14;

function getSecret(): string {
  const secret =
    process.env.SURVEY_LINK_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim();
  if (!secret || secret.length < 16) {
    throw new Error(
      "SURVEY_LINK_SECRET (or fallback NEXTAUTH_SECRET / SUPABASE_JWT_SECRET) must be set and at least 16 chars"
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

export function createSurveyToken(
  userId: string,
  questionId: string,
  answerKey: string,
  ttlDays: number = DEFAULT_TTL_DAYS
): string {
  const payload: SurveyTokenPayload = {
    u: userId,
    q: questionId,
    a: answerKey,
    e: Date.now() + ttlDays * 24 * 60 * 60 * 1000
  };
  const encoded = base64urlEncode(Buffer.from(JSON.stringify(payload)));
  const sig = sign(encoded, getSecret());
  return `${encoded}.${sig}`;
}

export type VerifyResult =
  | { ok: true; payload: SurveyTokenPayload }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" };

export function verifySurveyToken(token: string): VerifyResult {
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };

  const encoded = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expectedSig = sign(encoded, getSecret());

  // Constant-time compare to avoid timing leaks on the HMAC.
  const a = Buffer.from(providedSig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  let payload: SurveyTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(encoded).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }

  if (!payload.u || !payload.q || payload.a == null || !payload.e) {
    return { ok: false, reason: "malformed" };
  }

  if (Date.now() > payload.e) {
    return { ok: false, reason: "expired" };
  }

  return { ok: true, payload };
}
