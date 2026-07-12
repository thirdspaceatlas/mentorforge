import { describe, it, expect } from "vitest";
import {
  buildRebalanceInput,
  scopeTopicsForLevel,
  DEFAULT_SCOPE_DROP,
  type SavedPlanLike,
} from "@/lib/plan/rebalance/from-saved-plan";
import { computeNetDelta, rebalance } from "@/lib/plan/rebalance/engine";
import { extendExamWindow, raiseCapacity, reduceScope } from "@/lib/plan/rebalance/resolutions";

function week(startISO: string, endISO: string, plannedHours: number) {
  return { plannedHours, startDate: startISO, endDate: endISO };
}

function savedPlan(overrides: Partial<SavedPlanLike> = {}): SavedPlanLike {
  return {
    userId: "11111111-1111-1111-1111-111111111111",
    examDate: "2026-11-15",
    weeklyHours: 10,
    planStartDate: "2026-01-01",
    weekStartDay: "1",
    dayStartHour: 7,
    dayEndHour: 22,
    weekPlan: [
      week("2026-01-01", "2026-01-07", 10),
      week("2026-01-08", "2026-01-14", 10),
      week("2026-01-15", "2026-01-21", 10), // future relative to asOf below
    ],
    actualHours: [3, 0, null],
    ...overrides,
  };
}

const ASOF = new Date(Date.UTC(2026, 0, 13)); // 2026-01-13 (weeks 1 & 2 elapsed by end date? see below)

describe("buildRebalanceInput", () => {
  it("builds a deficit only from ELAPSED weeks (planned vs actual)", () => {
    // asOf 2026-01-13: week1 (ends 01-07) elapsed; week2 (ends 01-14) NOT yet; week3 future.
    const input = buildRebalanceInput(savedPlan(), ASOF);
    expect(input.sessions).toHaveLength(1); // only week 1
    // week1: planned 10h, actual 3h => 7h deficit
    expect(computeNetDelta(input.sessions)).toEqual({ deficitMinutes: 420, surplusMinutes: 0 });
  });

  it("counts more weeks as time passes", () => {
    const input = buildRebalanceInput(savedPlan(), new Date(Date.UTC(2026, 0, 20)));
    // Now weeks 1 (end 01-07) and 2 (end 01-14) are elapsed => 7h + 10h = 17h.
    expect(input.sessions).toHaveLength(2);
    expect(computeNetDelta(input.sessions).deficitMinutes).toBe(1020);
  });

  it("derives a positive target from the plan's committed hours and a valid profile", () => {
    const input = buildRebalanceInput(savedPlan(), ASOF);
    expect(input.targetMinutes).toBeGreaterThan(0);
    expect(input.profile.days).toHaveLength(7);
    expect(input.profile.guardrails.maxDailyMinutes).toBe(240);
    expect(input.examDate).toBe("2026-11-15");
  });

  it("a modest deficit with a long runway rebalances feasibly", () => {
    const res = rebalance(buildRebalanceInput(savedPlan(), new Date(Date.UTC(2026, 0, 20))));
    expect(res.kind).toBe("rebalanced");
  });
});

describe("buildRebalanceInput — infeasible plan + resolutions recompute", () => {
  // Big elapsed deficit, exam very soon, tiny weekly hours => infeasible.
  function tightSaved(): SavedPlanLike {
    return savedPlan({
      examDate: "2026-03-01",
      weeklyHours: 3,
      weekPlan: [
        week("2026-01-01", "2026-01-07", 20),
        week("2026-01-08", "2026-01-14", 20),
        week("2026-01-15", "2026-01-21", 20),
      ],
      actualHours: [0, 0, 0],
    });
  }

  it("raises an infeasibility event", () => {
    const input = buildRebalanceInput(tightSaved(), new Date(Date.UTC(2026, 0, 25)));
    const res = rebalance(input);
    expect(res.kind).toBe("infeasible");
  });

  it("each resolution recomputes from the reconstructed input", () => {
    const input = buildRebalanceInput(tightSaved(), new Date(Date.UTC(2026, 0, 25)));
    const extend = extendExamWindow(input, "2026-11-15");
    const raise = raiseCapacity(input);
    const cut = reduceScope(input, scopeTopicsForLevel(), DEFAULT_SCOPE_DROP);
    // Extending the exam by 8+ months must make it feasible; the others improve it.
    expect(extend.impact.nowFeasible).toBe(true);
    expect(cut.impact.reducedLoadMinutes as number).toBeLessThan(
      cut.impact.originalLoadMinutes as number,
    );
    expect([extend, raise, cut].every((o) => o.result.kind === "rebalanced" || o.result.kind === "infeasible")).toBe(true);
  });
});
