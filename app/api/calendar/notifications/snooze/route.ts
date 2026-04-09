import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/calendar/notifications/snooze — Snooze a study window notification.
 * Fixed 30-min delay for v1 (simplicity).
 *
 * Body: { windowId: string }
 * Returns: { snooze: SnoozedWindow }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { windowId } = body;

  if (!windowId) {
    return NextResponse.json({ error: "windowId required" }, { status: 400 });
  }

  // Verify window belongs to user
  const window = await prisma.studyWindow.findFirst({
    where: { id: windowId, userId: user.id },
  });

  if (!window) {
    return NextResponse.json({ error: "Window not found" }, { status: 404 });
  }

  const snoozeUntil = new Date(Date.now() + 30 * 60 * 1000); // +30 min

  const snooze = await prisma.snoozedWindow.create({
    data: {
      windowId,
      userId: user.id,
      snoozeUntil,
    },
  });

  return NextResponse.json({ snooze }, { status: 201 });
}
