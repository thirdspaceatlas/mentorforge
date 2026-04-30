import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/study-plan — Load the user's saved study plan.
 * Returns { plan: SavedStudyPlanPayload | null }
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const saved = await prisma.savedStudyPlan.findUnique({
    where: { userId: user.id },
  });

  if (!saved) {
    return NextResponse.json({ plan: null });
  }

  return NextResponse.json({
    plan: {
      examLevel: saved.examLevel,
      examDate: saved.examDate,
      weeklyHours: saved.weeklyHours,
      planStartDate: saved.planStartDate,
      weekStartDay: saved.weekStartDay,
      levelIIIPathway: saved.levelIIIPathway,
      forecastDays: saved.forecastDays,
      calendarPreferredSessionMin: saved.calendarPreferredSessionMin,
      dayStartHour: saved.dayStartHour,
      dayEndHour: saved.dayEndHour,
      weekPlan: saved.weekPlan,
      baseWeekPlan: saved.baseWeekPlan,
      actualHours: saved.actualHours,
    },
  });
}

/**
 * PUT /api/study-plan — Save or update the user's study plan (upsert).
 * Body: SavedStudyPlanPayload
 */
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { examLevel, examDate, weeklyHours, planStartDate, weekStartDay, levelIIIPathway, forecastDays, calendarPreferredSessionMin, dayStartHour, dayEndHour, weekPlan, baseWeekPlan, actualHours } = body;

  if (!examLevel || !examDate || weeklyHours == null || !planStartDate || !weekStartDay || !Array.isArray(weekPlan) || !Array.isArray(baseWeekPlan) || !Array.isArray(actualHours)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Preserve Calendar Coach fields when a client omits them (e.g. Plan auto-save
  // should not reset forecast range or working hours set from Account / Coach).
  const existing = await prisma.savedStudyPlan.findUnique({
    where: { userId: user.id },
  });

  const rawPref =
    calendarPreferredSessionMin != null
      ? Number(calendarPreferredSessionMin)
      : (existing?.calendarPreferredSessionMin ?? 45);
  const calendarPreferredSessionMinClamped = Number.isFinite(rawPref)
    ? Math.min(180, Math.max(5, Math.round(rawPref)))
    : Math.min(180, Math.max(5, existing?.calendarPreferredSessionMin ?? 45));

  let forecastDaysClamped = existing?.forecastDays ?? 1;
  if (forecastDays != null) {
    const n = Number(forecastDays);
    if (n === 1 || n === 3 || n === 5) forecastDaysClamped = n;
  }

  // Working-hours range: clamp 0-23 for start, ensure end > start, max 24.
  const startRaw =
    dayStartHour != null ? Number(dayStartHour) : (existing?.dayStartHour ?? 7);
  const endRaw =
    dayEndHour != null ? Number(dayEndHour) : (existing?.dayEndHour ?? 22);
  const dayStartHourClamped = Number.isFinite(startRaw)
    ? Math.min(23, Math.max(0, Math.round(startRaw)))
    : (existing?.dayStartHour ?? 7);
  const dayEndHourClamped = Number.isFinite(endRaw)
    ? Math.min(24, Math.max(dayStartHourClamped + 1, Math.round(endRaw)))
    : Math.max(dayStartHourClamped + 1, existing?.dayEndHour ?? 22);

  const data = {
    examLevel,
    examDate,
    weeklyHours: Number(weeklyHours),
    planStartDate,
    weekStartDay,
    levelIIIPathway: levelIIIPathway ?? null,
    forecastDays: forecastDaysClamped,
    calendarPreferredSessionMin: calendarPreferredSessionMinClamped,
    dayStartHour: dayStartHourClamped,
    dayEndHour: dayEndHourClamped,
    weekPlan,
    baseWeekPlan,
    actualHours,
  };

  await prisma.savedStudyPlan.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/study-plan — Clear the user's saved study plan.
 */
export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.savedStudyPlan.deleteMany({
    where: { userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
