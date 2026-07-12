/**
 * Gap finder — detects study windows between calendar events.
 *
 * Input: sorted list of busy periods + user preferences (min session length, day bounds).
 * Output: list of gaps (study windows) that meet the minimum duration.
 *
 * Rules:
 * - Only finds gaps within waking hours (default 7am-10pm user-local)
 * - Minimum gap must be >= minSessionMin (default 5 min)
 * - Merges overlapping busy periods before scanning
 * - Gaps are capped at the day boundary (no overnight windows)
 *
 * Timezone correctness (Phase 2): pass `timeZone` (an IANA id) so waking-hour
 * boundaries are computed in the USER's local wall time rather than the server's.
 * Without it, behavior is unchanged (server-local `setHours`) for backward compat.
 */

import { getZonedParts, zonedTimeToUtc } from "./timezone";

export type BusyPeriod = {
  start: Date;
  end: Date;
};

export type StudyGap = {
  start: Date;
  end: Date;
  durationMin: number;
};

export type GapFinderOptions = {
  /** Minimum session length in minutes (default: 15) */
  minSessionMin?: number;
  /** Maximum session length in minutes (default: 45). Longer gaps are split. */
  maxSessionMin?: number;
  /** Earliest hour to consider (0-23, default: 7) */
  dayStartHour?: number;
  /** Latest hour to consider (0-23, default: 22) */
  dayEndHour?: number;
  /** IANA timezone (e.g. "America/New_York"). When set, waking-hour boundaries
   *  are computed in the user's local wall time (DST-safe). Omit for legacy
   *  server-local behavior. */
  timeZone?: string;
};

/**
 * Find study gaps for a single day.
 *
 * @param date - The day to scan (used for day boundaries)
 * @param busyPeriods - Sorted list of busy blocks (may overlap)
 * @param options - Configuration
 */
export function findGapsForDay(
  date: Date,
  busyPeriods: BusyPeriod[],
  options: GapFinderOptions = {}
): StudyGap[] {
  const { minSessionMin = 15, maxSessionMin = 45, dayStartHour = 7, dayEndHour = 22, timeZone } = options;

  // Day boundaries. With a timeZone, anchor to the user's LOCAL calendar day and
  // wall hours (DST-safe); otherwise fall back to legacy server-local behavior.
  let dayStart: Date;
  let dayEnd: Date;
  if (timeZone) {
    const p = getZonedParts(date, timeZone);
    dayStart = zonedTimeToUtc(p.year, p.month, p.day, dayStartHour, 0, timeZone);
    dayEnd = zonedTimeToUtc(p.year, p.month, p.day, dayEndHour, 0, timeZone);
  } else {
    dayStart = new Date(date);
    dayStart.setHours(dayStartHour, 0, 0, 0);
    dayEnd = new Date(date);
    dayEnd.setHours(dayEndHour, 0, 0, 0);
  }

  // Filter to busy periods that overlap this day's window
  const relevant = busyPeriods
    .filter((bp) => bp.start < dayEnd && bp.end > dayStart)
    .map((bp) => ({
      start: bp.start < dayStart ? dayStart : bp.start,
      end: bp.end > dayEnd ? dayEnd : bp.end,
    }));

  // Merge overlapping periods
  const merged = mergePeriods(relevant);

  // Scan for gaps
  const rawGaps: { start: Date; end: Date }[] = [];
  let cursor = dayStart;

  for (const busy of merged) {
    if (busy.start > cursor) {
      rawGaps.push({ start: new Date(cursor), end: new Date(busy.start) });
    }
    if (busy.end > cursor) {
      cursor = busy.end;
    }
  }

  // Check for gap after last busy period
  if (cursor < dayEnd) {
    rawGaps.push({ start: new Date(cursor), end: new Date(dayEnd) });
  }

  // Split long gaps into chunks of maxSessionMin with 10-min breaks between
  const gaps: StudyGap[] = [];
  const breakMin = 10;

  for (const raw of rawGaps) {
    const totalMin = (raw.end.getTime() - raw.start.getTime()) / 60000;

    if (totalMin < minSessionMin) continue;

    if (totalMin <= maxSessionMin) {
      gaps.push({ start: raw.start, end: raw.end, durationMin: Math.floor(totalMin) });
    } else {
      // Split into sessions with breaks
      let blockStart = raw.start.getTime();
      const blockEnd = raw.end.getTime();

      while (blockStart < blockEnd) {
        const remaining = (blockEnd - blockStart) / 60000;
        if (remaining < minSessionMin) break;

        const sessionLen = Math.min(maxSessionMin, remaining);
        const sessionEnd = blockStart + sessionLen * 60000;

        gaps.push({
          start: new Date(blockStart),
          end: new Date(sessionEnd),
          durationMin: Math.floor(sessionLen),
        });

        blockStart = sessionEnd + breakMin * 60000; // add break
      }
    }
  }

  return gaps;
}

/**
 * Find gaps across multiple days.
 */
export function findGaps(
  startDate: Date,
  endDate: Date,
  busyPeriods: BusyPeriod[],
  options: GapFinderOptions = {}
): StudyGap[] {
  const sorted = [...busyPeriods].sort((a, b) => a.start.getTime() - b.start.getTime());
  const gaps: StudyGap[] = [];

  if (options.timeZone) {
    // Iterate the user's LOCAL calendar days so day boundaries are tz-correct.
    const tz = options.timeZone;
    const s = getZonedParts(startDate, tz);
    const e = getZonedParts(endDate, tz);
    const endKey = e.year * 10000 + e.month * 100 + e.day;
    let [y, m, d] = [s.year, s.month, s.day];
    for (let guard = 0; guard < 400; guard++) {
      if (y * 10000 + m * 100 + d > endKey) break;
      // Noon local is safely inside the day regardless of DST edges.
      const noonLocal = zonedTimeToUtc(y, m, d, 12, 0, tz);
      gaps.push(...findGapsForDay(noonLocal, sorted, options));
      const next = new Date(Date.UTC(y, m - 1, d + 1));
      [y, m, d] = [next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()];
    }
    return gaps;
  }

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dayGaps = findGapsForDay(current, sorted, options);
    gaps.push(...dayGaps);
    current.setDate(current.getDate() + 1);
  }

  return gaps;
}

/** Merge overlapping busy periods into non-overlapping blocks. */
function mergePeriods(periods: BusyPeriod[]): BusyPeriod[] {
  if (periods.length === 0) return [];

  const sorted = [...periods].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: BusyPeriod[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];

    if (current.start <= last.end) {
      // Overlapping — extend the end if needed
      if (current.end > last.end) {
        last.end = current.end;
      }
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}
