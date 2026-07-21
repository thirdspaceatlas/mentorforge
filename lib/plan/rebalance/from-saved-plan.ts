import { CFA_L1_TOPICS } from "@/lib/plan/syllabusCfaL1";
import { resolveGuardrails } from "./guardrails";
import type { ScopeTopic } from "./resolutions";
import type {
  AvailabilityProfile,
  DayOfWeek,
  PlannedSession,
  RebalanceInput,
} from "./types";

/**
 * Bridge: SavedStudyPlan (the output of plan generation) -> RebalanceInput
 * (what the adaptive engine consumes). The single canonical generator lives in
 * lib/plan/weekPlanBuilder.ts; the target here is the plan's own committed hours,
 * and planned-vs-actual weekly progress becomes the deficit the engine reasons about.
 *
 * Pure + DB-agnostic: takes a plain object matching the SavedStudyPlan columns so
 * it stays unit-testable without Prisma.
 */

export type WeekPlanJson = {
  plannedHours: number;
  startDate: string; // ISO (may include time)
  endDate: string; // ISO (may include time)
};

export type SavedPlanLike = {
  userId: string;
  examDate: string; // "YYYY-MM-DD"
  weeklyHours: number;
  planStartDate: string; // ISO date
  weekStartDay: string; // "0"-"6"
  dayStartHour: number;
  dayEndHour: number;
  weekPlan: unknown; // WeekPlanJson[]
  actualHours: unknown; // (number | null)[]
};

function dateOnly(v: string): string {
  return String(v).slice(0, 10);
}
function utcDate(iso: string): Date {
  const [y, m, d] = dateOnly(iso).split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** All CFA L1 topics as scope-cut candidates, weighted by exam-weight (recommended hours). */
export function scopeTopicsForLevel(): ScopeTopic[] {
  return CFA_L1_TOPICS.map((t) => ({
    id: t.id,
    name: t.name,
    weightHours: t.recommendedHours,
  }));
}

/** Lowest exam-weight topics first — the default "cut scope" set. */
export const DEFAULT_SCOPE_DROP = ["deriv", "alts", "pm", "fixed", "corpfin", "quant"];

/**
 * Reconstruct a RebalanceInput from a saved plan.
 * - target: the plan's own committed hours (single source of truth = what the
 *   user sees; produced by lib/plan/weekPlanBuilder at plan-creation time)
 * - profile: candidate's weekly hours distributed across the week, within their
 *   configured waking window; guardrails resolved (hard caps enforced)
 * - sessions: one logged session per ELAPSED week (planned vs actual) => the deficit
 */
export function buildRebalanceInput(saved: SavedPlanLike, asOf: Date): RebalanceInput {
  const examDate = dateOnly(saved.examDate);
  const weeklyHours = Math.max(0, saved.weeklyHours || 0);

  // --- availability profile: weekly hours spread across 7 days, capped by rails ---
  const dailyTargetMin = Math.round((weeklyHours * 60) / 7);
  // Fractional hours → minutes from midnight (e.g. 7.5 → 450).
  const winStart = Math.round(Math.max(0, Math.min(23 + 59 / 60, saved.dayStartHour)) * 60);
  const winEnd = Math.round(Math.max(1, Math.min(24, saved.dayEndHour)) * 60);
  const days = Array.from({ length: 7 }, (_, dow) => ({
    dayOfWeek: dow as DayOfWeek,
    available: dailyTargetMin > 0,
    windows:
      dailyTargetMin > 0
        ? [{ start: winStart, end: winEnd, targetSessionMinutes: dailyTargetMin }]
        : [],
  }));
  const profile: AvailabilityProfile = {
    userId: saved.userId,
    days,
    guardrails: resolveGuardrails(),
  };

  // --- deficit from elapsed weeks (planned vs actual) ---
  const weeks: WeekPlanJson[] = Array.isArray(saved.weekPlan)
    ? (saved.weekPlan as WeekPlanJson[])
    : [];
  const actuals: (number | null)[] = Array.isArray(saved.actualHours)
    ? (saved.actualHours as (number | null)[])
    : [];
  const asOfISO = asOf.toISOString().slice(0, 10);

  const sessions: PlannedSession[] = [];
  weeks.forEach((w, i) => {
    const endISO = dateOnly(w.endDate);
    if (endISO >= asOfISO) return; // only fully-elapsed weeks count toward deficit
    const planned = Math.round((w.plannedHours || 0) * 60);
    const actual = Math.round((actuals[i] ?? 0) * 60);
    sessions.push({
      id: `wk-${i}`,
      date: endISO,
      dayOfWeek: utcDate(endISO).getUTCDay() as DayOfWeek,
      windowId: null,
      topicIds: [],
      plannedMinutes: planned,
      actualMinutes: actual,
      status: actual >= planned ? "done" : "partial",
      source: "plan",
    });
  });

  // --- target load: the plan's own committed hours (single canonical generator) ---
  const totalPlannedHours = weeks.reduce((sum, w) => sum + (w.plannedHours || 0), 0);
  const daysUntilExam = Math.max(
    0,
    Math.round((utcDate(examDate).getTime() - asOf.getTime()) / 86_400_000),
  );
  // Fallback only if a plan somehow has no weeks yet.
  const targetMinutes = Math.round(
    (totalPlannedHours > 0 ? totalPlannedHours : weeklyHours * Math.ceil(daysUntilExam / 7)) * 60,
  );

  return { examDate, targetMinutes, profile, sessions, asOf };
}
