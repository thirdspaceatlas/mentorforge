import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/onboarding-preferences — Save onboarding choices so the planner
 * can pre-fill when the user first visits /app.
 *
 * Only creates a SavedStudyPlan if one doesn't exist yet (won't overwrite
 * an existing plan). Stores preferences + empty plan arrays so the planner
 * knows to pre-fill the form but still requires the user to click "Build my plan".
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { examLevel, examDate, weeklyHours, weekStartDay } = body;

  if (!examLevel || !examDate || weeklyHours == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Only save if no plan exists yet — don't overwrite an existing plan
  const existing = await prisma.savedStudyPlan.findUnique({
    where: { userId: user.id },
  });

  if (existing) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await prisma.savedStudyPlan.create({
    data: {
      userId: user.id,
      examLevel,
      examDate,
      weeklyHours: Number(weeklyHours),
      planStartDate: new Date().toISOString().slice(0, 10),
      weekStartDay: weekStartDay || "1",
      levelIIIPathway: null,
      weekPlan: [],
      baseWeekPlan: [],
      actualHours: [],
    },
  });

  return NextResponse.json({ ok: true });
}
