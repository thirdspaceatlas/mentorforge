import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { targetHoursForLevel } from "@/lib/study-plan/target-hours";

/**
 * GET /api/calendar/stats — Dashboard stats for Calendar Coach.
 *
 * Returns:
 *   minutesToday, pacePercent, daysToExam, calendarsConnected,
 *   heatmap (last 16 days, oldest → today), todayWindows, nextWindow.
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

  // 16-day range for the recent-consistency chart (today inclusive)
  const fourteenDaysAgo = new Date(todayStart);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 15);

  const [
    todaySessions,
    connections,
    todayWindows,
    recentSessions,
    savedStudyPlan,
  ] = await Promise.all([
    // Today's completed sessions (including interrupted — study time still counts)
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        completedAt: { not: null },
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
            plannedDurationMin: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    }),

    // Last 14 days of sessions for heatmap (interrupted sessions still count)
    prisma.studySession.findMany({
      where: {
        userId: user.id,
        completedAt: { not: null },
        startedAt: { gte: fourteenDaysAgo },
      },
      select: { startedAt: true, actualMin: true },
    }),

    prisma.savedStudyPlan.findUnique({
      where: { userId: user.id },
      select: {
        examLevel: true,
        examDate: true,
        weeklyHours: true,
        weekPlan: true,
        actualHours: true,
      },
    }),
  ]);

  let pacePercent = 0;
  let daysToExam = 0;
  let studyPlanSummary: {
    examLevel: string;
    examDate: string;
    weeklyHours: number;
    weekCount: number;
  } | null = null;

  if (savedStudyPlan) {
    const wp = savedStudyPlan.weekPlan;
    const weekCount = Array.isArray(wp) ? wp.length : 0;
    studyPlanSummary = {
      examLevel: savedStudyPlan.examLevel,
      examDate: savedStudyPlan.examDate,
      weeklyHours: savedStudyPlan.weeklyHours,
      weekCount,
    };

    const target = targetHoursForLevel(savedStudyPlan.examLevel);
    const actuals = savedStudyPlan.actualHours as unknown;
    const completed =
      Array.isArray(actuals)
        ? actuals.reduce<number>((s, a) => s + (typeof a === "number" ? a : 0), 0)
        : 0;
    pacePercent =
      target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

    const examIso = savedStudyPlan.examDate;
    if (typeof examIso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(examIso)) {
      const [ey, em, ed] = examIso.split("-").map(Number);
      const exam = new Date(ey, em - 1, ed);
      exam.setHours(0, 0, 0, 0);
      const diffMs = exam.getTime() - todayStart.getTime();
      daysToExam = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    }
  }

  // Minutes today
  const minutesToday = Math.round(
    todaySessions.reduce((sum, s) => sum + (s.actualMin ?? 0), 0)
  );

  // Recent-consistency chart: aggregate minutes per day
  const heatmap: { date: string; minutes: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const day = new Date(fourteenDaysAgo);
    day.setDate(day.getDate() + i);
    const dateStr = day.toISOString().slice(0, 10);
    const dayMin = recentSessions
      .filter((s) => s.startedAt.toISOString().slice(0, 10) === dateStr)
      .reduce((sum, s) => sum + (s.actualMin ?? 0), 0);
    heatmap.push({ date: dateStr, minutes: Math.round(dayMin) });
  }

  // Enrich today's windows with status.
  // "done" = a real StudySession completed.
  // "current" = right now is inside the window.
  // "missed" = endTime in the past with no completed session (time passed,
  //   nothing logged). Streak-free thesis stands: missed is not punished
  //   visually, but it is NOT counted as "done" on the dashboard.
  // "upcoming" = future, no session yet.
  const enrichedWindows = todayWindows.map((w) => {
    const session = w.sessions[0] ?? null;
    let status: "done" | "current" | "upcoming" | "missed" = "upcoming";
    if (session?.completedAt && !session.interrupted) status = "done";
    else if (w.startTime <= now && w.endTime >= now) status = "current";
    else if (w.endTime < now) status = "missed";

    return {
      id: w.id,
      topicName: w.topicName,
      studyType: w.studyType,
      startTime: w.startTime,
      durationMin:
        session?.plannedDurationMin != null
          ? session.plannedDurationMin
          : w.durationMin,
      status,
    };
  });

  // Next window: first upcoming or current
  const nextWindow =
    enrichedWindows.find((w) => w.status === "current" || w.status === "upcoming") ??
    null;

  /**
   * UX rule: at the very start of a day with nothing to show, surface only
   * the next session — calm default. Once the day is in motion (anything
   * done OR anything time-passed), show the day's narrative: done +
   * missed + the next session. Missed renders neutrally on the ribbon
   * (no rust, no "missed" word) so the streak-free thesis stands.
   */
  const completedToday = enrichedWindows.filter((w) => w.status === "done");
  const missedToday = enrichedWindows.filter((w) => w.status === "missed");
  const dayInMotion = completedToday.length > 0 || missedToday.length > 0 || minutesToday > 0;
  const todayWindowsForUI = dayInMotion
    ? [...completedToday, ...missedToday, ...(nextWindow ? [nextWindow] : [])]
    : nextWindow
    ? [nextWindow]
    : [];

  return NextResponse.json({
    minutesToday,
    pacePercent,
    daysToExam,
    studyPlanSummary,
    calendarsConnected: connections,
    todayWindows: todayWindowsForUI,
    nextWindow,
    heatmap,
  });
}
