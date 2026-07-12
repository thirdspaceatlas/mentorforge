import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  buildGeneratedStudyPlan,
  generateStudyPlanBodySchema,
} from "@/lib/plan/generateStudyPlan";
import { clampStudyPlanPrefs } from "@/lib/study-plan/clamp-prefs";
import type { SavedStudyPlanPayload } from "@/lib/study-plan/serialize";

/**
 * POST /api/study-plan/generate — Server-side plan generation for onboarding.
 * Auth: cookie session or Authorization: Bearer <token>.
 * Body: { examLevel, examDate, weeklyHours, planStartDate, weekStartDay?, levelIIIPathway?,
 *         dayStartHour?, dayEndHour?, calendarPreferredSessionMin? }
 * Returns: { plan: SavedStudyPlanPayload }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = generateStudyPlanBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.savedStudyPlan.findUnique({
    where: { userId: user.id },
  });

  const generated = buildGeneratedStudyPlan(parsed.data, {
    forecastDays: existing?.forecastDays,
  });

  const prefs = clampStudyPlanPrefs(generated, existing);

  const plan: SavedStudyPlanPayload = {
    ...generated,
    ...prefs,
  };

  await prisma.savedStudyPlan.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...plan },
    update: plan,
  });

  return NextResponse.json({ plan });
}
