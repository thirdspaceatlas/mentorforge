import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/calendar/stats — Dashboard stats for Calendar Coach.
 *
 * Returns:
 *   minutesToday, pacePercent, daysToExam, calendarsConnected,
 *   heatmap (last 14 days), todayWindows, nextWindow.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // 14-day range for heatmap
  const fourteenDaysAgo = new Date(todayStart);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const [
    todaySessions,
    connections,
    todayWindows,
    recentSessions,
  ] = await Promise.all([
    // Today's completed sessions
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        completedAt: { not: null },
        interrupted: false,
        startedAt: { gte: todayStart, lte: todayEnd },
      },
      select: { actualMin: true },
    }),

    // Connected calendars
    prisma.calendarConnection.count({
      where: { userId: user.id, enabled: true },
    }),

    // Today's windows with sessions
    prisma.studyWindow.findMany({
      where: {
        userId: user.id,
        startTime: { gte: todayStart },
        endTime: { lte: todayEnd },
      },
      include: {
        sessions: {
          select: {
            id: true,
            startedAt: true,
            completedAt: true,
            interrupted: true,
            actualMin: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    }),

    // Last 14 days of sessions for heatmap
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        completedAt: { not: null },
        interrupted: false,
        startedAt: { gte: fourteenDaysAgo },
      },
      select: { startedAt: true, actualMin: true },
    }),
  ]);

  // Minutes today
  const minutesToday = Math.round(
    todaySessions.reduce((sum, s) => sum + (s.actualMin ?? 0), 0)
  );

  // Heatmap: aggregate minutes per day
  const heatmap: { date: string; minutes: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const day = new Date(fourteenDaysAgo);
    day.setDate(day.getDate() + i);
    const dateStr = day.toISOString().slice(0, 10);
    const dayMin = recentSessions
      .filter((s) => s.startedAt.toISOString().slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + (s.actualMin ?? 0), 0);
    heatmap.push({ date: dateStr, minutes: Math.round(dayMin) });
  }

  // Enrich today's windows with status
  const enrichedWindows = todayWindows.map((w) => {
    const session = w.sessions[0] ?? null;
    let status: "done" | "current" | "upcoming" = "upcoming";
    if (session?.completedAt && !session.interrupted) status = "done";
    else if (w.startTime <= now && w.endTime >= now) status = "current";
    else if (w.endTime < now) status = "done";

    return {
      id: w.id,
      topicName: w.topicName,
      studyType: w.studyType,
      startTime: w.startTime,
      durationMin: w.durationMin,
      status,
    };
  });

  // Next window: first upcoming or current
  const nextWindow = enrichedWindows.find(
    (w) => w.status === "current" || w.status === "upcoming"
  ) ?? null;

  // TODO: Calculate pacePercent from study plan progress
  // TODO: Calculate daysToExam from exam instance

  return NextResponse.json({
    minutesToday,
    pacePercent: 0, // placeholder — needs study plan integration
    daysToExam: 0,  // placeholder — needs exam instance lookup
    calendarsConnected: connections,
    todayWindows: enrichedWindows,
    nextWindow,
    heatmap,
  });
}
