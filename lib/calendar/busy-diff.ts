import type { BusyPeriod } from "./gap-finder";

/**
 * Busy-time diffing for near-real-time gap detection (Phase 3). Between two sync
 * runs, compares the previous vs. current busy times and reports what FREED UP
 * (a meeting cancelled/shortened => a new gap) and what got ADDED. Pure and
 * timezone-agnostic (operates on absolute instants).
 */

export type Interval = { start: Date; end: Date };

function mergeOverlapping(periods: BusyPeriod[]): Interval[] {
  const sorted = periods
    .map((p) => ({ start: p.start, end: p.end }))
    .filter((p) => p.end.getTime() > p.start.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv.start.getTime() <= last.end.getTime()) {
      if (iv.end.getTime() > last.end.getTime()) last.end = iv.end;
    } else {
      out.push({ start: iv.start, end: iv.end });
    }
  }
  return out;
}

/** Parts of `base` intervals NOT covered by any `cut` interval. */
function subtract(base: Interval[], cut: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const b of base) {
    let segments: Interval[] = [{ start: b.start, end: b.end }];
    for (const c of cut) {
      const next: Interval[] = [];
      for (const s of segments) {
        // No overlap → keep as-is.
        if (c.end.getTime() <= s.start.getTime() || c.start.getTime() >= s.end.getTime()) {
          next.push(s);
          continue;
        }
        // Left remainder.
        if (c.start.getTime() > s.start.getTime()) {
          next.push({ start: s.start, end: new Date(Math.min(c.start.getTime(), s.end.getTime())) });
        }
        // Right remainder.
        if (c.end.getTime() < s.end.getTime()) {
          next.push({ start: new Date(Math.max(c.end.getTime(), s.start.getTime())), end: s.end });
        }
      }
      segments = next;
    }
    out.push(...segments.filter((s) => s.end.getTime() > s.start.getTime()));
  }
  return out;
}

/**
 * Diff previous vs. current busy times.
 * - `freed`: was busy before, is free now (new potential study gaps)
 * - `added`: is busy now, was free before (a gap disappeared)
 */
export function diffBusy(
  prev: BusyPeriod[],
  next: BusyPeriod[],
): { freed: Interval[]; added: Interval[] } {
  const p = mergeOverlapping(prev);
  const n = mergeOverlapping(next);
  return { freed: subtract(p, n), added: subtract(n, p) };
}

/**
 * Of the freed intervals, the ones worth acting on now: long enough to study and
 * starting soon (within the horizon), not already in the past.
 */
export function newlyQualifyingGaps(
  freed: Interval[],
  opts: { now: Date; horizonMinutes: number; minGapMinutes: number },
): Interval[] {
  const horizonEnd = opts.now.getTime() + opts.horizonMinutes * 60000;
  return freed.filter((f) => {
    const durationMin = (f.end.getTime() - f.start.getTime()) / 60000;
    return (
      durationMin >= opts.minGapMinutes &&
      f.start.getTime() < horizonEnd &&
      f.end.getTime() > opts.now.getTime()
    );
  });
}
