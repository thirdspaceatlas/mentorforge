/**
 * Working-hours helpers — dayStartHour / dayEndHour are fractional hours
 * (e.g. 7.5 = 7:30am, 22 = 10:00pm, 24 = midnight end-of-day).
 */

export const DEFAULT_DAY_START = 7;
export const DEFAULT_DAY_END = 22;

/** Minimum span between start and end (hours). */
const MIN_SPAN_HOURS = 15 / 60; // 15 minutes

export function splitFractionalHour(hour: number): { h: number; m: number } {
  if (!Number.isFinite(hour)) return { h: 0, m: 0 };
  // Midnight end-of-day sentinel
  if (hour >= 24) return { h: 24, m: 0 };
  const clamped = Math.min(23.999, Math.max(0, hour));
  const h = Math.floor(clamped);
  const m = Math.round((clamped - h) * 60);
  if (m >= 60) return { h: h + 1, m: 0 };
  return { h, m };
}

export function joinHourMinute(h: number, m: number): number {
  if (h >= 24) return 24;
  return Math.min(23 + 59 / 60, Math.max(0, h + m / 60));
}

/** "7:30am", "12pm", "10pm", "12am" (for 0 or 24) */
export function formatFractionalHourLabel(hour: number): string {
  const { h, m } = splitFractionalHour(hour);
  const displayH = h === 24 ? 0 : h;
  const suffix = displayH >= 12 ? "pm" : "am";
  const twelve = displayH % 12 === 0 ? 12 : displayH % 12;
  if (m === 0) return `${twelve}${suffix}`;
  return `${twelve}:${String(m).padStart(2, "0")}${suffix}`;
}

/** HTML time input value "HH:MM". Maps end=24 → "00:00" with isMidnightEnd flag via separate helper. */
export function hourToTimeValue(hour: number): string {
  if (hour >= 24) return "00:00";
  const { h, m } = splitFractionalHour(hour);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parse "HH:MM" from a time input.
 * For end times, pass `asEnd: true` so "00:00" means midnight (24).
 */
export function timeValueToHour(value: string, asEnd = false): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || m < 0 || m > 59) return null;
  if (asEnd && h === 0 && m === 0) return 24;
  if (h < 0 || h > 23) return null;
  return joinHourMinute(h, m);
}

export function clampWorkingHours(
  startRaw: number,
  endRaw: number
): { dayStartHour: number; dayEndHour: number } {
  const dayStartHour = Number.isFinite(startRaw)
    ? Math.min(23 + 59 / 60, Math.max(0, startRaw))
    : DEFAULT_DAY_START;
  let dayEndHour = Number.isFinite(endRaw)
    ? Math.min(24, Math.max(0, endRaw))
    : DEFAULT_DAY_END;
  if (dayEndHour <= dayStartHour) {
    dayEndHour = Math.min(24, dayStartHour + Math.max(MIN_SPAN_HOURS, 1));
  }
  return { dayStartHour, dayEndHour };
}
