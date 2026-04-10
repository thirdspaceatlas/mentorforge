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

  const { examLevel, examDate, weeklyHours, planStartDate, weekStartDay, levelIIIPathway, weekPlan, baseWeekPlan, actualHours } = body;

  if (!examLevel || !examDate || weeklyHours == null || !planStartDate || !weekStartDay || !Array.isArray(weekPlan) || !Array.isArray(baseWeekPlan) || !Array.isArray(actualHours)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const data = {
    examLevel,
    examDate,
    weeklyHours: Number(weeklyHours),
    planStartDate,
    weekStartDay,
    levelIIIPathway: levelIIIPathway ?? null,
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
