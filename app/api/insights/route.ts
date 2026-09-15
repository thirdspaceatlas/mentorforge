import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { recommendTopic } from "@/lib/plan/nudge/recommend-topic";
import { fallback, signatureOf, type Signals } from "@/lib/insights/insights";
import { tryLlmBlurbs } from "@/lib/insights/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await prisma.savedStudyPlan.findUnique({ where: { userId: user.id } });
  if (!plan) return NextResponse.json({ error: "No study plan yet" }, { status: 404 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5);
  const sessions = await prisma.studySession.findMany({
    where: { userId: user.id, startedAt: { gte: weekAgo } },
  });
  const totalWeeks = Array.isArray(plan.weekPlan) ? (plan.weekPlan as unknown[]).length : 0;
  const completedWeeks = Math.min(
    totalWeeks,
    Math.max(
      0,
      Math.floor((now.getTime() - new Date(plan.planStartDate).getTime()) / (7 * 864e5)),
    ),
  );
  const hoursLogged = sessions.reduce((a, s) => a + (s.actualMin ?? 0), 0) / 60;
  const hoursPlanned = plan.weeklyHours ?? 0;
  const rec = recommendTopic({
    planStartDate: plan.planStartDate,
    examDate: plan.examDate,
    now,
  });

  const signals: Signals = {
    examLevel: plan.examLevel,
    examDate: plan.examDate,
    daysToExam: Math.max(
      0,
      Math.ceil((new Date(plan.examDate).getTime() - now.getTime()) / 864e5),
    ),
    totalWeeks,
    completedWeeks,
    hoursLogged,
    hoursPlanned,
    pacePercent: hoursPlanned > 0 ? Math.round((hoursLogged / hoursPlanned) * 100) : 0,
    feasible:
      (await prisma.infeasibilityEvent.count({
        where: { userId: user.id, resolvedAt: null },
      })) === 0,
    currentTopic: rec?.topicName ?? null,
  };

  const sig = signatureOf(signals);

  if (plan.insightSignature === sig && plan.insightReadiness && plan.insightCoachTip) {
    return NextResponse.json({
      readiness: plan.insightReadiness,
      coachTip: plan.insightCoachTip,
      cached: true,
      generatedAt: plan.insightGeneratedAt,
    });
  }

  const llm = await tryLlmBlurbs(signals, {
    userId: user.id,
    sessionId: `insights-${user.id}-${sig}`,
  });
  const out = llm ?? fallback(signals);
  const source = llm ? ("llm" as const) : ("fallback" as const);

  await prisma.savedStudyPlan.update({
    where: { userId: user.id },
    data: {
      insightReadiness: out.readiness,
      insightCoachTip: out.coachTip,
      insightSignature: sig,
      insightGeneratedAt: now,
    },
  });

  return NextResponse.json({
    readiness: out.readiness,
    coachTip: out.coachTip,
    cached: false,
    generatedAt: now.toISOString(),
    source,
  });
}
