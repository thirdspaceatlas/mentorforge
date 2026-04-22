import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getResendClient, getResendFrom } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

/**
 * Preview profiles with emails + send one-off outreach (not marketing automation).
 *
 * - GET  — list up to 100 `profiles` rows with non-null email (newest first).
 * - POST — send the same HTML email to each address (one Resend call per recipient).
 *
 * Auth: `Authorization: Bearer <CRON_SECRET>` (same pattern as `/api/cron/sync-calendars`).
 *
 * Requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (verified sender).
 */
function authorize(req: NextRequest): boolean {
  const secret = req.headers.get("authorization");
  return secret === `Bearer ${process.env.CRON_SECRET}`;
}

const postBodySchema = z.object({
  to: z.array(z.string().email()).min(1).max(50),
  subject: z.string().min(1).max(300),
  html: z.string().min(1),
  replyTo: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.profile.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    count: profiles.length,
    profiles: profiles.map((p) => ({
      id: p.id,
      email: p.email,
      createdAt: p.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json({ error: "RESEND_API_KEY is not set" }, { status: 500 });
  }

  let from: string;
  try {
    from = getResendFrom();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const resend = getResendClient();
  const { to, subject, html, replyTo } = parsed.data;

  const results = await Promise.all(
    to.map(async (address) => {
      const { data, error } = await resend.emails.send({
        from,
        to: [address],
        subject,
        html,
        ...(replyTo ? { replyTo } : {}),
      });
      return { to: address, id: data?.id ?? null, error: error ?? null };
    })
  );

  const failed = results.filter((r) => r.error);
  return NextResponse.json({
    ok: failed.length === 0,
    sent: results.length,
    failed: failed.length,
    results,
  });
}
