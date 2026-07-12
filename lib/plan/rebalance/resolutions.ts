import { computeNetDelta, daysBetween, rebalance, rebalanceForLoad } from "./engine";
import type { RebalanceInput, RebalanceResult } from "./types";

/**
 * The infeasible branch (spec §7) — the heart of the feature.
 *
 * When the deficit can't be absorbed before the exam within guardrails, the
 * engine raises an infeasibility event and the candidate CHOOSES a tradeoff.
 * Each resolution here RECOMPUTES a fresh plan and reports its impact so the
 * choice is informed, never hidden. Persist the chosen outcome for history.
 */

export type ScopeTopic = { id: string; name: string; weightHours: number };

export type ResolutionKind = "extend-exam-window" | "raise-capacity" | "reduce-scope";

export type ResolutionOutcome = {
  kind: ResolutionKind;
  /** The recomputed input this resolution implies (persist alongside choice). */
  input: RebalanceInput;
  /** Freshly recomputed plan under the resolution. */
  result: RebalanceResult;
  /** Human-facing impact of the tradeoff ("show the cost"). */
  impact: Record<string, unknown> & { nowFeasible: boolean };
};

/** 1) Extend the exam date — recompute a feasible plan against the new runway. */
export function extendExamWindow(
  input: RebalanceInput,
  newExamDateISO: string,
): ResolutionOutcome {
  const newInput: RebalanceInput = { ...input, examDate: newExamDateISO };
  const result = rebalance(newInput);
  return {
    kind: "extend-exam-window",
    input: newInput,
    result,
    impact: {
      previousExamDate: input.examDate,
      newExamDate: newExamDateISO,
      addedDays: daysBetween(input.examDate, newExamDateISO),
      nowFeasible: result.kind === "rebalanced",
    },
  };
}

/**
 * 2) Increase weekly capacity — raise the candidate's daily target toward the
 * hard cap and recompute. Shows the cost (new daily target vs. the ceiling).
 */
export function raiseCapacity(
  input: RebalanceInput,
  opts?: { dailyTargetMinutes?: number },
): ResolutionOutcome {
  const g = input.profile.guardrails;
  const target = Math.min(opts?.dailyTargetMinutes ?? g.maxDailyMinutes, g.maxDailyMinutes);

  const days = input.profile.days.map((d) => {
    if (!d.available || d.windows.length === 0) return d;
    const current = d.windows.reduce((sum, w) => sum + w.targetSessionMinutes, 0);
    if (current >= target) return d;
    const factor = current > 0 ? target / current : 1;
    const windows = d.windows.map((w) => ({
      ...w,
      targetSessionMinutes: Math.round(w.targetSessionMinutes * factor),
    }));
    return { ...d, windows };
  });

  const newInput: RebalanceInput = {
    ...input,
    profile: { ...input.profile, days },
  };
  const result = rebalance(newInput);
  return {
    kind: "raise-capacity",
    input: newInput,
    result,
    impact: {
      newDailyTargetMinutes: target,
      hardCapMinutes: g.maxDailyMinutes,
      nowFeasible: result.kind === "rebalanced",
    },
  };
}

/**
 * 3) Reduce scope — drop/deprioritize the lowest exam-weight topics and recompute.
 * The required load shrinks by the dropped topics' exam-weight share; the coverage
 * cost is surfaced explicitly.
 */
export function reduceScope(
  input: RebalanceInput,
  topics: ScopeTopic[],
  dropTopicIds: string[],
): ResolutionOutcome {
  const totalWeight = topics.reduce((sum, t) => sum + t.weightHours, 0) || 1;
  const dropped = topics.filter((t) => dropTopicIds.includes(t.id));
  const droppedWeight = dropped.reduce((sum, t) => sum + t.weightHours, 0);
  const droppedShare = droppedWeight / totalWeight;

  const { deficitMinutes, surplusMinutes } = computeNetDelta(input.sessions);
  const netDeficit = Math.max(0, deficitMinutes - surplusMinutes);
  const reducedLoad = Math.max(0, Math.round(netDeficit * (1 - droppedShare)));

  const result = rebalanceForLoad(input, reducedLoad);
  return {
    kind: "reduce-scope",
    input,
    result,
    impact: {
      droppedTopicIds: dropTopicIds,
      droppedTopics: dropped.map((t) => t.name),
      droppedSharePct: Math.round(droppedShare * 100),
      coverageRemainingPct: Math.round((1 - droppedShare) * 100),
      originalLoadMinutes: netDeficit,
      reducedLoadMinutes: reducedLoad,
      nowFeasible: result.kind === "rebalanced",
    },
  };
}
