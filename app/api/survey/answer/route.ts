import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySurveyToken } from "@/lib/survey/signed-link";
import { getPublicSiteOrigin } from "@/lib/site";

/**
 * GET /api/survey/answer?t=<token>
 *
 * Verifies an HMAC-signed token from a digest email, upserts a UserSurveyResponse
 * row, then redirects the user to a minimal thank-you landing.
 * No auth needed — the signature IS the auth (server-signed, expires in 14 days).
 */
export async function GET(req: NextRequest) {
  const origin = getPublicSiteOrigin();
  const token = req.nextUrl.searchParams.get("t");

  if (!token) {
    return NextResponse.redirect(new URL("/survey/thanks?status=missing", origin));
  }

  const result = verifySurveyToken(token);
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/survey/thanks?status=${result.reason}`, origin)
    );
  }

  // Only record the most recent answer per (user, question). A re-click updates
  // the stored answer rather than producing duplicate rows.
  const existing = await prisma.userSurveyResponse.findFirst({
    where: { userId: result.payload.u, question: result.payload.q },
    orderBy: { answeredAt: "desc" }
  });

  if (existing) {
    await prisma.userSurveyResponse.update({
      where: { id: existing.id },
      data: { answer: result.payload.a, answeredAt: new Date() }
    });
  } else {
    await prisma.userSurveyResponse.create({
      data: {
        userId: result.payload.u,
        question: result.payload.q,
        answer: result.payload.a
      }
    });
  }

  return NextResponse.redirect(new URL("/survey/thanks?status=ok", origin));
}
