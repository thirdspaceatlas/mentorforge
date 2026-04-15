import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
 
/**
 * DELETE /api/calendar/reset — Hard reset Calendar Coach data.
 *
 * Clears:
 * - Calendar connections (and their synced CalendarEvents via FK cascade)
 * - Study windows + sessions history
 * - Snoozed windows + session patterns (sync/optimization state)
 *
 * Does NOT touch study plan data.
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
  await prisma.$transaction([
    prisma.studySession.deleteMany({ where: { userId: user.id } }),
    prisma.snoozedWindow.deleteMany({ where: { userId: user.id } }),
    prisma.studyWindow.deleteMany({ where: { userId: user.id } }),
    prisma.sessionPattern.deleteMany({ where: { userId: user.id } }),
    prisma.calendarConnection.deleteMany({ where: { userId: user.id } }),
  ]);
 
  return NextResponse.json({ ok: true });
}
