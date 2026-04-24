import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResendClient, getResendFrom } from "@/lib/email/resend";
import {
  buildDigestHtml,
  buildDigestSubject,
  buildDigestText,
  buildDigestToneLine
} from "@/lib/email/digest";
import { pickQuestionForUser } from "@/lib/survey/questions";

/**
 * GET /api/cron/weekly-digest — Sunday job (registered in vercel.json).
 *
 * For each profile with an email, builds a one-question weekly digest and sends
 * via Resend. The question rotates based on weeks-since-signup. Answers come
 * back as signed GETs to /api/survey/answer — no login needed.
 *
 * Auth: Bearer CRON_SECRET (matches the /api/cron/sync-calendars + /api/cron/outreach-email pattern).
 */

const PAGE_SIZE = 50;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function authorize(req: NextRequest): boolean {
  const header = req.headers.get("authorization");
  return header === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set" },
      { status: 500 }
    );
  }

  let from: string;
  try {
    from = getResendFrom();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }

  const resend = getResendClient();
  const weekAgo = new Date(Date.now() - WEEK_MS);
  const now = new Date();

  let cursor: string | undefined;
  let sent = 0;
  let skipped = 0;
  const errors: { userId: string; error: string }[] = [];

  // Paginate by Profile.id to cap memory at PAGE_SIZE per iteration.
  // Safe for current scale (<1k users); revisit with a queue if we get bigger.
  while (true) {
    const batch = await prisma.profile.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true, firstName: true, createdAt: true },
      orderBy: { id: "asc" },
      take: PAGE_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
    });

    if (batch.length === 0) break;

    for (const profile of batch) {
      if (!profile.email) {
        skipped++;
        continue;
      }

      try {
        const sessions = await prisma.studySession.findMany({
          where: {
            userId: profile.id,
            startedAt: { gte: weekAgo }
          },
          select: { actualMin: true, completedAt: true, interrupted: true }
        });

        const completedSessions = sessions.filter(
          (s) => s.completedAt != null || s.interrupted
        );
        const totalMinutes = Math.round(
          completedSessions.reduce((acc, s) => acc + (s.actualMin ?? 0), 0)
        );

        const stats = {
          sessionsThisWeek: completedSessions.length,
          minutesThisWeek: totalMinutes,
          toneLine: buildDigestToneLine(completedSessions.length)
        };
        const question = pickQuestionForUser(profile.createdAt, now);

        const payload = {
          userId: profile.id,
          firstName: profile.firstName ?? null,
          stats,
          question
        };

        await resend.emails.send({
          from,
          to: profile.email,
          subject: buildDigestSubject(stats),
          html: buildDigestHtml(payload),
          text: buildDigestText(payload)
        });

        sent++;
      } catch (e) {
        errors.push({
          userId: profile.id,
          error: e instanceof Error ? e.message : String(e)
        });
      }
    }

    if (batch.length < PAGE_SIZE) break;
    cursor = batch[batch.length - 1]!.id;
  }

  return NextResponse.json({ ok: true, sent, skipped, errors });
}
