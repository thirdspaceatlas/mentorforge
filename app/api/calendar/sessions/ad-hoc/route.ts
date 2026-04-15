import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/calendar/sessions/ad-hoc — Create an ad-hoc study window + session.
 * Used when all scheduled windows are done but the user wants to keep studying.
 * Body (optional): { durationMin?: number } — clamped 5–180, default 45.
 * Returns: { windowId: string, sessionId: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let durationMin = 45;
  try {
    const body = await req.json();
    if (body?.durationMin != null && typeof body.durationMin === "number") {
      durationMin = Math.min(180, Math.max(5, Math.round(body.durationMin)));
    }
  } catch {
    // empty body
  }

  const now = new Date();
  const end = new Date(now.getTime() + durationMin * 60 * 1000);

  const window = await prisma.studyWindow.create({
    data: {
      userId: user.id,
      startTime: now,
      endTime: end,
      durationMin,
      topicName: "Extra study session",
      studyType: "practice",
    },
  });

  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      windowId: window.id,
      startedAt: now,
      plannedDurationMin: durationMin,
    },
  });

  return NextResponse.json({ windowId: window.id, sessionId: session.id }, { status: 201 });
}
