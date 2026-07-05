import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { getPublicSiteOrigin } from "@/lib/site";

/**
 * GET /api/email/unsubscribe?t=... — one-click opt-out from weekly digest emails.
 * Redirects to /email/unsubscribed on success.
 */

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");
  const origin = getPublicSiteOrigin();
  const failUrl = new URL("/email/unsubscribed", origin);
  failUrl.searchParams.set("status", "invalid");

  const verified = verifyUnsubscribeToken(token);
  if (!verified.ok) {
    return NextResponse.redirect(failUrl);
  }

  try {
    await prisma.profile.update({
      where: { id: verified.payload.u },
      data: { emailCommunicationsOptIn: false, emailOptOutAt: new Date() },
    });
  } catch {
    return NextResponse.redirect(failUrl);
  }

  const okUrl = new URL("/email/unsubscribed", origin);
  okUrl.searchParams.set("status", "ok");
  return NextResponse.redirect(okUrl);
}
