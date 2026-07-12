import { describe, it, expect } from "vitest";
import { diffBusy, newlyQualifyingGaps } from "@/lib/calendar/busy-diff";

const d = (h: number, m = 0) => new Date(Date.UTC(2026, 0, 15, h, m));

describe("diffBusy", () => {
  it("reports a cancelled meeting as freed time", () => {
    const prev = [{ start: d(9), end: d(10) }, { start: d(14), end: d(15) }];
    const next = [{ start: d(14), end: d(15) }]; // 9–10 cancelled
    const { freed, added } = diffBusy(prev, next);
    expect(freed).toHaveLength(1);
    expect(freed[0].start.toISOString()).toBe(d(9).toISOString());
    expect(freed[0].end.toISOString()).toBe(d(10).toISOString());
    expect(added).toHaveLength(0);
  });

  it("reports a shortened meeting's tail as freed", () => {
    const prev = [{ start: d(9), end: d(10) }];
    const next = [{ start: d(9), end: d(9, 30) }]; // ends 30m early
    const { freed } = diffBusy(prev, next);
    expect(freed).toHaveLength(1);
    expect(freed[0].start.toISOString()).toBe(d(9, 30).toISOString());
    expect(freed[0].end.toISOString()).toBe(d(10).toISOString());
  });

  it("reports a newly-added meeting", () => {
    const { added, freed } = diffBusy([], [{ start: d(11), end: d(12) }]);
    expect(added).toHaveLength(1);
    expect(freed).toHaveLength(0);
  });

  it("no change yields empty diff", () => {
    const same = [{ start: d(9), end: d(10) }];
    const { freed, added } = diffBusy(same, same);
    expect(freed).toHaveLength(0);
    expect(added).toHaveLength(0);
  });
});

describe("newlyQualifyingGaps", () => {
  const now = d(9);
  it("keeps a soon, long-enough freed gap", () => {
    const freed = [{ start: d(9, 10), end: d(10) }]; // 50 min, starts in 10 min
    const q = newlyQualifyingGaps(freed, { now, horizonMinutes: 120, minGapMinutes: 25 });
    expect(q).toHaveLength(1);
  });
  it("drops gaps that are too short", () => {
    const freed = [{ start: d(9, 10), end: d(9, 25) }]; // 15 min
    expect(newlyQualifyingGaps(freed, { now, horizonMinutes: 120, minGapMinutes: 25 })).toHaveLength(0);
  });
  it("drops gaps beyond the horizon", () => {
    const freed = [{ start: d(13), end: d(14) }]; // starts in 4h
    expect(newlyQualifyingGaps(freed, { now, horizonMinutes: 120, minGapMinutes: 25 })).toHaveLength(0);
  });
  it("drops gaps already in the past", () => {
    const freed = [{ start: d(7), end: d(8) }]; // ended before now
    expect(newlyQualifyingGaps(freed, { now, horizonMinutes: 120, minGapMinutes: 25 })).toHaveLength(0);
  });
});
