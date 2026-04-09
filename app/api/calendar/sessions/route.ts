import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/calendar/sessions — Start a study session for a window.
 * Idempotent: if a session already exists for the window, returns it.
 *
 * Body: { windowId: string }
 * Returns: { session: StudySession }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { windowId } = body;

  if (!windowId || typeof windowId !== "string") {
    return NextResponse.json({ error: "windowId is required" }, { status: 400 });
  }

  // Verify window belongs to user and hasn't expired
  const window = await prisma.studyWindow.findFirst({
    where: { id: windowId, userId: user.id },
  });

  if (!window) {
    return NextResponse.json({ error: "Window not found" }, { status: 404 });
  }

  // Atomic upsert — idempotent, no race condition on concurrent requests
  const session = await prisma.studySession.upsert({
    where: { windowId },
    update: {}, // no-op if already exists
    create: {
      userId: user.id,
      windowId,
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}

/**
 * PATCH /api/calendar/sessions — Complete or interrupt a session.
 *
 * Body: { sessionId: string, action: "complete" | "interrupt" }
 * Returns: { session: StudySession }
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { sessionId, action } = body;

  if (!sessionId || !["complete", "interrupt"].includes(action)) {
    return NextResponse.json(
      { error: "sessionId and action (complete|interrupt) required" },
      { status: 400 }
    );
  }

  const session = await prisma.studySession.findFirst({
    where: { id: sessionId, userId: user.id },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.completedAt) {
    return NextResponse.json({ error: "Session already completed" }, { status: 409 });
  }

  const now = new Date();
  const actualMin = (now.getTime() - session.startedAt.getTime()) / 60000;

  const updated = await prisma.studySession.update({
    where: { id: sessionId },
    data: {
      completedAt: now,
      interrupted: action === "interrupt",
      actualMin: Math.round(actualMin * 10) / 10, // one decimal place
    },
  });

  return NextResponse.json({ session: updated });
}
