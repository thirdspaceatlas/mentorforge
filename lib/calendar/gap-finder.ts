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
 */

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
  /** Minimum session length in minutes (default: 5) */
  minSessionMin?: number;
  /** Earliest hour to consider (0-23, default: 7) */
  dayStartHour?: number;
  /** Latest hour to consider (0-23, default: 22) */
  dayEndHour?: number;
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
  const { minSessionMin = 5, dayStartHour = 7, dayEndHour = 22 } = options;

  // Day boundaries in the same timezone as the input date
  const dayStart = new Date(date);
  dayStart.setHours(dayStartHour, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(dayEndHour, 0, 0, 0);

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
  const gaps: StudyGap[] = [];
  let cursor = dayStart;

  for (const busy of merged) {
    if (busy.start > cursor) {
      const durationMin = (busy.start.getTime() - cursor.getTime()) / 60000;
      if (durationMin >= minSessionMin) {
        gaps.push({ start: new Date(cursor), end: new Date(busy.start), durationMin: Math.floor(durationMin) });
      }
    }
    if (busy.end > cursor) {
      cursor = busy.end;
    }
  }

  // Check for gap after last busy period
  if (cursor < dayEnd) {
    const durationMin = (dayEnd.getTime() - cursor.getTime()) / 60000;
    if (durationMin >= minSessionMin) {
      gaps.push({ start: new Date(cursor), end: new Date(dayEnd), durationMin: Math.floor(durationMin) });
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
