/**
 * Pure helpers for the RecentConsistencyBars component. No DOM, no React —
 * testable in isolation. Reaffirms the streak-free thesis: minutes-based
 * shading and counts only, no streak counter, no punishment for gaps.
 */

export const TARGET_MIN = 60;
export const MAX_BAR_MIN = 120;

export type ConsistencyDay = {
  date: string; // YYYY-MM-DD
  minutes: number;
};

export type ConsistencySummary = {
  daysStudied: number;
  total: number;
  totalMinutes: number;
  aboveTargetDays: number;
  bestIndex: number | null;
  todayIndex: number | null;
  rangeLabel: string;
};

export function summarize(
  days: ConsistencyDay[],
  todayDate?: string
): ConsistencySummary {
  const today = todayDate ?? toDateKey(new Date());
  let bestIndex: number | null = null;
  let bestMinutes = 0;
  let todayIndex: number | null = null;
  let daysStudied = 0;
  let totalMinutes = 0;
  let aboveTargetDays = 0;

  days.forEach((d, i) => {
    if (d.minutes > 0) daysStudied++;
    if (d.minutes >= TARGET_MIN) aboveTargetDays++;
    totalMinutes += d.minutes;
    if (d.minutes > bestMinutes) {
      bestMinutes = d.minutes;
      bestIndex = i;
    }
    if (d.date === today) todayIndex = i;
  });

  return {
    daysStudied,
    total: days.length,
    totalMinutes,
    aboveTargetDays,
    bestIndex,
    todayIndex,
    rangeLabel: formatRange(days),
  };
}

/** "27 APR — 12 MAY" — for the editorial right-aligned meta block. */
export function formatRange(days: ConsistencyDay[]): string {
  if (days.length === 0) return "";
  const first = parseDateKey(days[0].date);
  const last = parseDateKey(days[days.length - 1].date);
  return `${formatDay(first)} — ${formatDay(last)}`;
}

/** "1h 30m" / "45m" — for stat values. */
export function formatHoursLogged(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Decimal hours like "19.0h" — alternative right-aligned variant. */
export function formatDecimalHours(totalMinutes: number): string {
  return `${(totalMinutes / 60).toFixed(1)}h`;
}

/**
 * Neutral, data-aware coach copy. No streak language, no guilt.
 * Returns one short editorial sentence.
 */
export function coachCopy(s: ConsistencySummary): string {
  const ratio = s.daysStudied / Math.max(1, s.total);
  if (ratio >= 0.85) return "Almost every day this fortnight.";
  if (ratio >= 0.55) return "Holding steady this stretch.";
  if (ratio >= 0.25) return "A quieter window — still moving.";
  return "Quiet stretch. No worries.";
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(d: Date): string {
  const day = d.getDate();
  const mo = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${day} ${mo}`;
}
