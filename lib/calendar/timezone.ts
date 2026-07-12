/**
 * Timezone utilities — FORGE Phase 2 (correctness).
 *
 * Pure and dependency-free: uses the built-in `Intl` API (full ICU ships with
 * Node), so it works identically on any server timezone. The whole point of this
 * module is to stop the app from reasoning in the SERVER's local time and
 * instead reason in each user's own IANA timezone (e.g. "America/New_York").
 *
 * All functions treat `Date` as an absolute instant (UTC epoch); the timezone
 * only matters when we translate to/from a human WALL-CLOCK time.
 */

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday, in the target timezone. */
  dayOfWeek: number;
};

/** Is `tz` a valid IANA timezone identifier? Used for onboarding validation. */
export function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const _fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = _fmtCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    _fmtCache.set(timeZone, f);
  }
  return f;
}

/** Wall-clock parts for an absolute instant `date`, as seen in `timeZone`. */
export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = formatterFor(timeZone).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = get("hour");
  if (hour === 24) hour = 0; // some ICU versions emit "24" at midnight under h23
  const minute = get("minute");
  const second = get("second");
  // Day-of-week from the zoned calendar date (stable across ICU versions).
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, hour, minute, second, dayOfWeek };
}

/**
 * Offset of `timeZone` at the absolute instant `date`, in minutes, where
 * `localWallTime = utc + offset`. New York winter → -300 (EST), summer → -240 (EDT).
 */
export function getOffsetMinutes(date: Date, timeZone: string): number {
  const p = getZonedParts(date, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asIfUtc - date.getTime()) / 60000);
}

/**
 * Convert a WALL-CLOCK time in `timeZone` to the correct absolute UTC instant,
 * DST-safe. e.g. 7:00 on 2026-01-15 in America/New_York → 12:00:00Z (EST),
 * but 7:00 on 2026-07-15 → 11:00:00Z (EDT).
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  // First approximation using the offset at the naive instant…
  const offset1 = getOffsetMinutes(new Date(wallAsUtc), timeZone);
  let utc = wallAsUtc - offset1 * 60000;
  // …then refine once (handles instants that land the other side of a DST edge).
  const offset2 = getOffsetMinutes(new Date(utc), timeZone);
  if (offset2 !== offset1) utc = wallAsUtc - offset2 * 60000;
  return new Date(utc);
}

/** Day-of-week (0=Sun…6=Sat) of the local calendar day containing `date` in `timeZone`. */
export function zonedDayOfWeek(date: Date, timeZone: string): number {
  return getZonedParts(date, timeZone).dayOfWeek;
}
