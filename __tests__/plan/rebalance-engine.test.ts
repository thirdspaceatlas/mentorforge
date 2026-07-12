import { describe, it, expect } from "vitest";
import {
  computeNetDelta,
  rebalance,
  rebalanceForLoad,
  computeCapacity,
  buildCapacityDays,
  weekKeyOf,
  daysBetween,
} from "@/lib/plan/rebalance/engine";
import {
  extendExamWindow,
  raiseCapacity,
  reduceScope,
  type ScopeTopic,
} from "@/lib/plan/rebalance/resolutions";
import { DEFAULT_GUARDRAILS } from "@/lib/plan/rebalance/guardrails";
import { CFA_L1_TOPICS } from "@/lib/plan/syllabusCfaL1";
import type {
  AvailabilityProfile,
  DayOfWeek,
  Guardrails,
  PlannedSession,
  RebalanceInput,
} from "@/lib/plan/rebalance/types";

// ---------- fixtures ----------

/** Build a PlannedSession with sensible defaults; override per test. */
function session(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return {
    id: "s1",
    date: "2026-01-01",
    dayOfWeek: 0,
    windowId: "w1",
    topicIds: ["t1"],
    plannedMinutes: 60,
    actualMinutes: 60,
    status: "done",
    source: "plan",
    ...overrides,
  };
}

/** All 7 days available, one window each with the given daily target. */
function profile(
  dailyTargetMinutes: number,
  guardrails: Guardrails = DEFAULT_GUARDRAILS,
): AvailabilityProfile {
  const days = Array.from({ length: 7 }, (_, dow) => ({
    dayOfWeek: dow as DayOfWeek,
    available: true,
    windows: [{ start: 540, end: 720, targetSessionMinutes: dailyTargetMinutes }],
  }));
  return { userId: "u1", days, guardrails };
}

/** UTC anchor so tests are deterministic regardless of server tz (Phase 2). */
const ASOF = new Date(Date.UTC(2026, 0, 1)); // 2026-01-01

function input(overrides: Partial<RebalanceInput> = {}): RebalanceInput {
  return {
    examDate: "2026-12-31",
    targetMinutes: 18000,
    profile: profile(120),
    sessions: [],
    asOf: ASOF,
    ...overrides,
  };
}

const scopeTopics: ScopeTopic[] = CFA_L1_TOPICS.map((t) => ({
  id: t.id,
  name: t.name,
  weightHours: t.recommendedHours,
}));

// ---------- §6.1 net delta (unchanged behavior) ----------

describe("computeNetDelta", () => {
  it("returns zero delta for an empty session list", () => {
    expect(computeNetDelta([])).toEqual({ deficitMinutes: 0, surplusMinutes: 0 });
  });

  it("ignores unlogged sessions (actualMinutes == null)", () => {
    const sessions = [
      session({ id: "a", plannedMinutes: 60, actualMinutes: null }),
      session({ id: "b", plannedMinutes: 90, actualMinutes: null }),
    ];
    expect(computeNetDelta(sessions)).toEqual({ deficitMinutes: 0, surplusMinutes: 0 });
  });

  it("accrues shortfalls to deficitMinutes", () => {
    expect(computeNetDelta([session({ plannedMinutes: 60, actualMinutes: 40 })])).toEqual({
      deficitMinutes: 20,
      surplusMinutes: 0,
    });
  });

  it("credits off-hours effort as surplus (never discarded)", () => {
    const sessions = [
      session({ id: "off", source: "off-hours", windowId: null, plannedMinutes: 0, actualMinutes: 45 }),
    ];
    expect(computeNetDelta(sessions)).toEqual({ deficitMinutes: 0, surplusMinutes: 45 });
  });

  it("accumulates deficit and surplus independently across mixed sessions", () => {
    const sessions = [
      session({ id: "a", plannedMinutes: 60, actualMinutes: 30 }), // -30
      session({ id: "b", plannedMinutes: 60, actualMinutes: 100 }), // +40
      session({ id: "c", plannedMinutes: 60, actualMinutes: null }), // ignored
      session({ id: "d", plannedMinutes: 45, actualMinutes: 20 }), // -25
    ];
    expect(computeNetDelta(sessions)).toEqual({ deficitMinutes: 55, surplusMinutes: 40 });
  });
});

// ---------- missed-day ----------

describe("rebalance — missed day", () => {
  it("places a missed session's deficit forward as a proposed plan change", () => {
    const sessions = [session({ plannedMinutes: 120, actualMinutes: 0 })]; // 120m behind
    const res = rebalance(input({ sessions }));
    expect(res.kind).toBe("rebalanced");
    if (res.kind !== "rebalanced") return;
    const placed = res.sessions.reduce((a, s) => a + s.plannedMinutes, 0);
    expect(placed).toBe(120);
    expect(res.sessions.every((s) => s.status === "planned")).toBe(true);
    expect(res.grade).toBe("on-track");
  });
});

// ---------- surplus ----------

describe("rebalance — surplus", () => {
  it("lets surplus cancel the deficit and banks the remaining buffer", () => {
    const sessions = [
      session({ id: "ahead", plannedMinutes: 60, actualMinutes: 150 }), // +90
      session({ id: "behind", plannedMinutes: 60, actualMinutes: 30 }), // -30
    ];
    const res = rebalance(input({ sessions }));
    expect(res.kind).toBe("rebalanced");
    if (res.kind !== "rebalanced") return;
    expect(res.sessions).toHaveLength(0); // nothing to place
    expect(res.surplusMinutes).toBe(60); // 90 - 30 banked
    expect(res.grade).toBe("on-track");
  });
});

// ---------- guardrail: per-day cap (MAX_HOURS_PER_DAY) ----------

describe("guardrail — per-day cap", () => {
  it("never schedules more than maxDailyMinutes on any single day", () => {
    // Candidate target 600m/day, but hard cap is 240m (4h).
    const inp = input({ profile: profile(600) });
    const res = rebalanceForLoad(inp, 5000); // large but feasible over the year
    expect(res.kind).toBe("rebalanced");
    if (res.kind !== "rebalanced") return;
    expect(res.sessions.every((s) => s.plannedMinutes <= DEFAULT_GUARDRAILS.maxDailyMinutes)).toBe(true);
    expect(Math.max(...res.sessions.map((s) => s.plannedMinutes))).toBe(240);
  });
});

// ---------- guardrail: per-week cap (MAX_HOURS_PER_WEEK) ----------

describe("guardrail — per-week cap", () => {
  it("never schedules more than maxWeeklyHours in any Monday-anchored week", () => {
    const inp = input({ profile: profile(240) }); // 4h/day would be 24h/wk without the cap
    const res = rebalanceForLoad(inp, 8000);
    expect(res.kind).toBe("rebalanced");
    if (res.kind !== "rebalanced") return;
    const perWeek: Record<string, number> = {};
    for (const s of res.sessions) {
      perWeek[weekKeyOf(s.date)] = (perWeek[weekKeyOf(s.date)] ?? 0) + s.plannedMinutes;
    }
    const cap = DEFAULT_GUARDRAILS.maxWeeklyHours * 60;
    expect(Object.values(perWeek).every((m) => m <= cap)).toBe(true);
  });
});

// ---------- guardrail: partial week ----------

describe("guardrail — partial first week", () => {
  it("respects the weekly cap even when the first week is partial", () => {
    // 2026-01-01 is a Thursday → first Monday-week bucket is partial (Thu–Sun).
    const inp = input({ profile: profile(240) });
    const res = rebalanceForLoad(inp, 8000);
    expect(res.kind).toBe("rebalanced");
    if (res.kind !== "rebalanced") return;
    // No placed day precedes asOf.
    expect(res.sessions.every((s) => s.date >= "2026-01-01")).toBe(true);
    const firstWeek = weekKeyOf("2026-01-01");
    const firstWeekMinutes = res.sessions
      .filter((s) => weekKeyOf(s.date) === firstWeek)
      .reduce((a, s) => a + s.plannedMinutes, 0);
    expect(firstWeekMinutes).toBeLessThanOrEqual(DEFAULT_GUARDRAILS.maxWeeklyHours * 60);
  });
});

// ---------- guardrail: consecutive days (MAX_CONSECUTIVE_DAYS) ----------

describe("guardrail — consecutive-day rest rule", () => {
  it("never places study on more than maxConsecutiveDays in a row", () => {
    const inp = input({ profile: profile(240) });
    const res = rebalanceForLoad(inp, 8000);
    expect(res.kind).toBe("rebalanced");
    if (res.kind !== "rebalanced") return;
    const dates = [...new Set(res.sessions.map((s) => s.date))].sort();
    let run = 1;
    let maxRun = 1;
    for (let i = 1; i < dates.length; i++) {
      run = daysBetween(dates[i - 1], dates[i]) === 1 ? run + 1 : 1;
      maxRun = Math.max(maxRun, run);
    }
    expect(maxRun).toBeLessThanOrEqual(DEFAULT_GUARDRAILS.maxConsecutiveDays);
  });
});

// ---------- guardrail: buffer (MIN_BUFFER_DAYS) ----------

describe("guardrail — exam buffer window", () => {
  it("schedules no new content within minBufferDays of the exam", () => {
    const inp = input({ profile: profile(240) });
    const res = rebalanceForLoad(inp, 8000);
    expect(res.kind).toBe("rebalanced");
    if (res.kind !== "rebalanced") return;
    const minDaysToExam = Math.min(
      ...res.sessions.map((s) => daysBetween(s.date, inp.examDate)),
    );
    expect(minDaysToExam).toBeGreaterThan(DEFAULT_GUARDRAILS.minBufferDays);
  });

  it("buildCapacityDays excludes the buffer window entirely", () => {
    const inp = input({ profile: profile(240) });
    const days = buildCapacityDays(inp);
    expect(days.every((d) => daysBetween(d.dateISO, inp.examDate) > DEFAULT_GUARDRAILS.minBufferDays)).toBe(true);
  });
});

// ---------- the infeasible branch + the three resolutions ----------

describe("infeasibility event + resolutions", () => {
  // A short runway with a tiny daily target → capacity is small.
  function tightInput() {
    return input({ examDate: "2026-02-15", profile: profile(30) }); // ~45d out, 30m/day
  }

  it("raises a first-class infeasibility event instead of overfilling", () => {
    const inp = tightInput();
    const capacity = computeCapacity(inp);
    const load = capacity + 600; // guaranteed not to fit
    const sessions = [session({ plannedMinutes: load, actualMinutes: 0 })];
    const res = rebalance({ ...inp, sessions });

    expect(res.kind).toBe("infeasible");
    if (res.kind !== "infeasible") return;
    expect(res.unplaceableMinutes).toBe(600);
    expect(res.grade).toBe("at-risk");
    expect(res.message).toMatch(/behind/i);
    // At-risk always offers to move the exam date, first.
    expect(res.options[0]).toBe("extend-exam-window");
    expect(res.options).toEqual(
      expect.arrayContaining(["extend-exam-window", "reduce-scope", "raise-capacity"]),
    );
  });

  it("resolution 1 — extending the exam date recomputes a feasible plan", () => {
    const inp = tightInput();
    const load = computeCapacity(inp) + 600;
    const sessions = [session({ plannedMinutes: load, actualMinutes: 0 })];
    const infeasible = { ...inp, sessions };

    const outcome = extendExamWindow(infeasible, "2026-12-31");
    expect(outcome.impact.nowFeasible).toBe(true);
    expect(outcome.result.kind).toBe("rebalanced");
    expect(outcome.impact.addedDays as number).toBeGreaterThan(0);
  });

  it("resolution 2 — raising weekly capacity recomputes a feasible plan", () => {
    const inp = tightInput();
    const load = computeCapacity(inp) + 600;
    const sessions = [session({ plannedMinutes: load, actualMinutes: 0 })];
    const infeasible = { ...inp, sessions };

    const outcome = raiseCapacity(infeasible); // raise toward the 240m/day hard cap
    expect(outcome.impact.newDailyTargetMinutes).toBe(240);
    expect(outcome.impact.nowFeasible).toBe(true);
    expect(outcome.result.kind).toBe("rebalanced");
  });

  it("resolution 3 — cutting the lowest-weight scope recomputes a feasible plan", () => {
    const inp = tightInput();
    const load = computeCapacity(inp) + 600;
    const sessions = [session({ plannedMinutes: load, actualMinutes: 0 })];
    const infeasible = { ...inp, sessions };

    // Drop a large, low-priority share of exam weight.
    const drop = ["ethics", "fra", "equity", "quant", "econ", "corpfin"];
    const outcome = reduceScope(infeasible, scopeTopics, drop);

    expect(outcome.impact.reducedLoadMinutes as number).toBeLessThan(
      outcome.impact.originalLoadMinutes as number,
    );
    expect(outcome.impact.coverageRemainingPct as number).toBeLessThan(100);
    expect(outcome.impact.nowFeasible).toBe(true);
    expect(outcome.result.kind).toBe("rebalanced");
  });

  it("all three resolutions independently recompute correctly from one event", () => {
    const inp = tightInput();
    const load = computeCapacity(inp) + 600;
    const sessions = [session({ plannedMinutes: load, actualMinutes: 0 })];
    const infeasible = { ...inp, sessions };

    const extend = extendExamWindow(infeasible, "2027-01-31");
    const raise = raiseCapacity(infeasible);
    const cut = reduceScope(infeasible, scopeTopics, ["ethics", "fra", "equity", "quant", "econ", "corpfin"]);

    expect([extend, raise, cut].every((o) => o.impact.nowFeasible === true)).toBe(true);
  });
});
