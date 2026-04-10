import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/calendar/sessions/ad-hoc — Create an ad-hoc study window + session.
 * Used when all scheduled windows are done but the user wants to keep studying.
 * Creates a 60-minute window starting now, then starts a session for it.
 * Returns: { windowId: string, sessionId: string }
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes from now

  const window = await prisma.studyWindow.create({
    data: {
      userId: user.id,
      startTime: now,
      endTime: end,
      durationMin: 60,
      topicName: "Extra study session",
      studyType: "practice",
    },
  });

  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      windowId: window.id,
      startedAt: now,
    },
  });

  return NextResponse.json({ windowId: window.id, sessionId: session.id }, { status: 201 });
}
