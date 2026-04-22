import { Resend } from "resend";

export function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is required");
  }
  return new Resend(key);
}

/** Verified sender in Resend (e.g. `MentorForge <hello@yourdomain.com>`). */
export function getResendFrom(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) {
    throw new Error(
      "RESEND_FROM_EMAIL is required (add a verified domain sender in Resend)"
    );
  }
  return from;
}
