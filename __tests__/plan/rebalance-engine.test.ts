import { describe, it, expect } from "vitest";
import { computeNetDelta, rebalance } from "@/lib/plan/rebalance/engine";
import type { PlannedSession } from "@/lib/plan/rebalance/types";

/** Build a PlannedSession with sensible defaults; override per test. */
function session(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return {
    id: "s1",
    date: "2026-11-15",
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
    const sessions = [session({ plannedMinutes: 60, actualMinutes: 40 })];
    expect(computeNetDelta(sessions)).toEqual({ deficitMinutes: 20, surplusMinutes: 0 });
  });

  it("accrues overages to surplusMinutes", () => {
    const sessions = [session({ plannedMinutes: 60, actualMinutes: 90 })];
    expect(computeNetDelta(sessions)).toEqual({ deficitMinutes: 0, surplusMinutes: 30 });
  });

  it("treats an exact match (delta == 0) as neither deficit nor surplus", () => {
    const sessions = [session({ plannedMinutes: 60, actualMinutes: 60 })];
    expect(computeNetDelta(sessions)).toEqual({ deficitMinutes: 0, surplusMinutes: 0 });
  });

  it("credits off-hours effort as surplus (never discarded)", () => {
    const sessions = [
      session({ id: "off", source: "off-hours", windowId: null, plannedMinutes: 0, actualMinutes: 45 }),
    ];
    expect(computeNetDelta(sessions)).toEqual({ deficitMinutes: 0, surplusMinutes: 45 });
  });

  it("accumulates deficit and surplus independently across mixed sessions", () => {
    const sessions = [
      session({ id: "a", plannedMinutes: 60, actualMinutes: 30 }), // -30 deficit
      session({ id: "b", plannedMinutes: 60, actualMinutes: 100 }), // +40 surplus
      session({ id: "c", plannedMinutes: 60, actualMinutes: null }), // ignored
      session({ id: "d", plannedMinutes: 45, actualMinutes: 20 }), // -25 deficit
    ];
    expect(computeNetDelta(sessions)).toEqual({ deficitMinutes: 55, surplusMinutes: 40 });
  });
});

describe("rebalance", () => {
  it("throws — skeleton not yet implemented (FORGE-6)", () => {
    expect(() =>
      rebalance({
        examDate: "2026-11-15",
        targetMinutes: 18000,
        profile: {} as never,
        sessions: [],
        asOf: new Date(2026, 6, 5),
      }),
    ).toThrow(/not implemented/i);
  });
});
