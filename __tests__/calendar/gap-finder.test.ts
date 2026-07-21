import { describe, it, expect } from "vitest";
import { findGapsForDay, findGaps } from "@/lib/calendar/gap-finder";

/** Helper to create a date on a fixed day at a given hour:minute */
function at(hour: number, minute = 0): Date {
  return new Date(2026, 3, 9, hour, minute, 0, 0); // April 9, 2026
}

const DAY = new Date(2026, 3, 9); // April 9, 2026

/** Large cap so tests assert calendar geometry (merge/clip) without max-session chunking */
const NO_CHUNK = { maxSessionMin: 10080 } as const;

describe("findGapsForDay", () => {
  it("returns full day as one gap when no busy periods", () => {
    const gaps = findGapsForDay(DAY, [], NO_CHUNK);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMin).toBe(15 * 60); // 7am to 10pm = 900 min
  });

  it("finds gap before a single busy block", () => {
    const gaps = findGapsForDay(DAY, [{ start: at(9), end: at(10) }], NO_CHUNK);
    // Gap 1: 7:00-9:00 = 120 min, Gap 2: 10:00-22:00 = 720 min
    expect(gaps).toHaveLength(2);
    expect(gaps[0].durationMin).toBe(120);
    expect(gaps[1].durationMin).toBe(720);
  });

  it("finds gap between two busy blocks", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(7), end: at(9) },
      { start: at(10), end: at(12) },
    ], NO_CHUNK);
    // Gap 1: 9:00-10:00 = 60 min, Gap 2: 12:00-22:00 = 600 min
    expect(gaps).toHaveLength(2);
    expect(gaps[0].durationMin).toBe(60);
    expect(gaps[1].durationMin).toBe(600);
  });

  it("merges overlapping busy periods", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(8), end: at(10) },
      { start: at(9), end: at(11) }, // overlaps with first
    ], NO_CHUNK);
    // Merged: 8:00-11:00. Gap before: 7:00-8:00 = 60, Gap after: 11:00-22:00 = 660
    expect(gaps).toHaveLength(2);
    expect(gaps[0].durationMin).toBe(60);
    expect(gaps[1].durationMin).toBe(660);
  });

  it("merges adjacent busy periods", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(8), end: at(9) },
      { start: at(9), end: at(10) }, // adjacent, not overlapping
    ], NO_CHUNK);
    // Merged: 8:00-10:00. Gap before: 7:00-8:00, Gap after: 10:00-22:00
    expect(gaps).toHaveLength(2);
    expect(gaps[0].durationMin).toBe(60);
  });

  it("excludes gaps shorter than minSessionMin", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(7), end: at(9, 57) }, // 3-min gap before 10:00
      { start: at(10), end: at(22) },
    ], { ...NO_CHUNK, minSessionMin: 5 });
    // Only gap is 9:57-10:00 = 3 min, excluded. No gaps returned.
    expect(gaps).toHaveLength(0);
  });

  it("respects custom minSessionMin", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(7), end: at(9, 50) },
      { start: at(10), end: at(22) },
    ], { ...NO_CHUNK, minSessionMin: 10 });
    // Gap: 9:50-10:00 = 10 min. At minSessionMin=10, it IS included.
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMin).toBe(10);
  });

  it("clips busy periods to day boundaries", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(5), end: at(8) }, // starts before dayStartHour
    ], NO_CHUNK);
    // Clipped to 7:00-8:00. Gap after: 8:00-22:00 = 840 min
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMin).toBe(840);
  });

  it("returns no gaps when entire day is busy", () => {
    const gaps = findGapsForDay(DAY, [{ start: at(6), end: at(23) }], NO_CHUNK);
    expect(gaps).toHaveLength(0);
  });

  it("handles multiple small gaps between meetings", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(7), end: at(8) },
      { start: at(8, 12), end: at(9) },     // 12 min gap
      { start: at(9, 7), end: at(10) },      // 7 min gap
      { start: at(10, 3), end: at(22) },     // 3 min gap (excluded at 5 min min)
    ], { ...NO_CHUNK, minSessionMin: 5 });
    expect(gaps).toHaveLength(2);
    expect(gaps[0].durationMin).toBe(12);
    expect(gaps[1].durationMin).toBe(7);
  });

  it("respects custom day bounds", () => {
    const gaps = findGapsForDay(DAY, [], { ...NO_CHUNK, dayStartHour: 9, dayEndHour: 17 });
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMin).toBe(8 * 60); // 9am to 5pm = 480 min
  });

  it("respects fractional (minute-precision) day bounds", () => {
    const gaps = findGapsForDay(DAY, [], {
      ...NO_CHUNK,
      dayStartHour: 7.5,
      dayEndHour: 8.25,
    });
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMin).toBe(45); // 7:30–8:15
  });

  it("handles busy period that spans entire available window", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(7), end: at(22) },
    ], NO_CHUNK);
    expect(gaps).toHaveLength(0);
  });

  it("handles reverse-ordered busy periods", () => {
    const gaps = findGapsForDay(DAY, [
      { start: at(14), end: at(15) },
      { start: at(9), end: at(10) },  // out of order
    ], NO_CHUNK);
    // Should still work: gap 7-9, 10-14, 15-22
    expect(gaps).toHaveLength(3);
  });

  it("splits long gaps when maxSessionMin is smaller than the free block", () => {
    const gaps = findGapsForDay(DAY, [], { maxSessionMin: 120 });
    expect(gaps.length).toBeGreaterThan(1);
    gaps.forEach((g) => {
      expect(g.durationMin).toBeLessThanOrEqual(120);
    });
  });
});

describe("findGaps (multi-day)", () => {
  it("produces gaps for each day in range", () => {
    const start = new Date(2026, 3, 9);
    const end = new Date(2026, 3, 11); // 3 days

    const gaps = findGaps(start, end, [], NO_CHUNK);
    // Each day: 7am-10pm = 900 min. 3 days = 3 gaps.
    expect(gaps).toHaveLength(3);
    gaps.forEach((g) => expect(g.durationMin).toBe(900));
  });

  it("busy period on one day doesn't affect other days", () => {
    const start = new Date(2026, 3, 9);
    const end = new Date(2026, 3, 10);

    const gaps = findGaps(start, end, [
      { start: new Date(2026, 3, 9, 7, 0), end: new Date(2026, 3, 9, 22, 0) }, // all-day on day 1
    ], NO_CHUNK);
    // Day 1: 0 gaps. Day 2: 1 full gap (900 min).
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMin).toBe(900);
  });
});
