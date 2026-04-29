/**
 * Pure layout helpers for the DayRibbon timeline component.
 * No React. No DOM. Testable in isolation.
 */

export const DAY_START = 6; // 6 AM
export const DAY_END = 23; // 11 PM
export const DAY_SPAN = DAY_END - DAY_START; // 17 hours

/** Hours that get a vertical tick + label on the ribbon. */
export const HOUR_TICKS: ReadonlyArray<number> = [6, 9, 12, 15, 18, 21];

/** Convert an hour-of-day (e.g. 16.75 = 4:45 PM) to a percent across the ribbon. */
export function xfor(hour: number): number {
  const pct = ((hour - DAY_START) / DAY_SPAN) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Return whether the hour is within the ribbon's visible range. */
export function inRibbonRange(hour: number): boolean {
  return hour >= DAY_START && hour <= DAY_END;
}

/** Hours-since-midnight as a fractional number. Reads minute precision. */
export function hourOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

/** "06:00", "09:00", etc. — tick labels in mono. */
export function formatHourLabel(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}
