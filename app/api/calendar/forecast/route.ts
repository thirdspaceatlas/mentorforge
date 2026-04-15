import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { findGapsForDay, type BusyPeriod } from "@/lib/calendar/gap-finder";

/**
 * GET /api/calendar/forecast — Study window forecast for upcoming days.
 *
 * Query params:
 *   days — 1, 3, or 5 (default 1)
 *
 * Returns per-day summary of available study windows.
 * Uses existing StudyWindows if available, otherwise runs gap finder
 * against synced CalendarEvents.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const daysParam = parseInt(url.searchParams.get("days") || "1", 10);
  const days = [1, 3, 5].includes(daysParam) ? daysParam : 1;

  const prefRow = await prisma.savedStudyPlan.findUnique({
    where: { userId: user.id },
    select: { calendarPreferredSessionMin: true },
  });
  const maxSessionMin = Math.min(
    180,
    Math.max(5, prefRow?.calendarPreferredSessionMin ?? 45)
  );

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endDate = new Date(tomorrow);
  endDate.setDate(endDate.getDate() + days - 1);
  endDate.setHours(23, 59, 59, 999);

  type DayForecast = {
    date: string;
    dayLabel: string;
    windowCount: number;
    totalMin: number;
  };

  // Always run gap finder fresh against calendar events (avoids stale/oversized windows)
  const connections = await prisma.calendarConnection.findMany({
    where: { userId: user.id, enabled: true },
    select: { id: true },
  });

  if (connections.length === 0) {
    // No calendars connected — every day is free
    const forecast: DayForecast[] = [];
    const cursor = new Date(tomorrow);
    for (let i = 0; i < days; i++) {
      forecast.push({
        date: cursor.toISOString().slice(0, 10),
        dayLabel: formatDayLabel(cursor),
        windowCount: 0,
        totalMin: 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return NextResponse.json({ forecast, days });
  }

  const connectionIds = connections.map((c) => c.id);

  const events = await prisma.calendarEvent.findMany({
    where: {
      connectionId: { in: connectionIds },
      startTime: { gte: tomorrow },
      endTime: { lte: endDate },
      busyStatus: "busy",
    },
    orderBy: { startTime: "asc" },
  });

  const busyPeriods: BusyPeriod[] = events.map((e) => ({
    start: e.startTime,
    end: e.endTime,
  }));

  const forecast: DayForecast[] = [];
  const cursor = new Date(tomorrow);
  for (let i = 0; i < days; i++) {
    const dayGaps = findGapsForDay(cursor, busyPeriods, {
      minSessionMin: 5,
      maxSessionMin,
    });
    forecast.push({
      date: cursor.toISOString().slice(0, 10),
      dayLabel: formatDayLabel(cursor),
      windowCount: dayGaps.length,
      totalMin: dayGaps.reduce((sum, g) => sum + g.durationMin, 0),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json({ forecast, days });
}

function formatDayLabel(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toISOString().slice(0, 10) === tomorrow.toISOString().slice(0, 10)) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", { weekday: "long" });
}
