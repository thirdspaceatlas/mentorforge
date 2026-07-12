import { DEFAULT_GUARDRAILS } from "./guardrails";
import type {
  DayOfWeek,
  FeasibilityGrade,
  Guardrails,
  NetDelta,
  PlannedSession,
  RebalanceInput,
  RebalanceResult,
} from "./types";

/**
 * Adaptive rebalancing engine — FORGE-6 (build-ready).
 *
 * Implements docs/forge-3-rebalancing-spec.md §6 as PROPOSE-AND-CONFIRM (locked
 * decision): the engine returns a proposed plan change or a first-class
 * infeasibility event — it never silently rewrites the plan and never crams to
 * "make it fit". The four protective constants (per-day, per-week,
 * consecutive-days, buffer) are hard caps the placement must respect.
 */

// ---------- date helpers (UTC; per-user IANA tz is Phase 2) ----------
function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}
function toISO(dt: Date): string {
  return dt.toISOString().slice(0, 10);
}
function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}
export function daysBetween(aISO: string, bISO: string): number {
  return Math.round(
    (parseISO(bISO).getTime() - parseISO(aISO).getTime()) / 86_400_000,
  );
}
function dowOf(iso: string): DayOfWeek {
  return parseISO(iso).getUTCDay() as DayOfWeek;
}
/** Monday-anchored week key so per-week caps handle partial first/last weeks. */
export function weekKeyOf(iso: string): string {
  const isoDow = (dowOf(iso) + 6) % 7; // 0 = Monday
  return addDays(iso, -isoDow);
}

// ---------- §6.1 net delta ----------
/**
 * Compute net delta from logged sessions. Shortfalls accrue to `deficitMinutes`;
 * overages (including `off-hours` source) accrue to `surplusMinutes`. Surplus is
 * never discarded (principle #5: reward getting ahead). Unlogged sessions
 * (`actualMinutes == null`) are ignored.
 */
export function computeNetDelta(sessions: PlannedSession[]): NetDelta {
  let deficitMinutes = 0;
  let surplusMinutes = 0;
  for (const s of sessions) {
    if (s.actualMinutes == null) continue;
    const delta = s.actualMinutes - s.plannedMinutes;
    if (delta < 0) deficitMinutes += -delta;
    else surplusMinutes += delta;
  }
  return { deficitMinutes, surplusMinutes };
}

// ---------- §6.2 open future capacity ----------
export type CapacityDay = {
  dateISO: string;
  dow: DayOfWeek;
  weekKey: string;
  /** Absorptive headroom for NEW load, after the candidate target is capped
   *  by the hard daily cap and existing planned load is subtracted. */
  headroomMinutes: number;
};

/**
 * Enumerate placeable days from `asOf` (inclusive) up to the buffer cutoff. The
 * final `minBufferDays` before the exam are reserved for review/mock — no new
 * content is scheduled there.
 */
export function buildCapacityDays(
  input: RebalanceInput,
  guardrails?: Guardrails,
): CapacityDay[] {
  const g = guardrails ?? input.profile.guardrails ?? DEFAULT_GUARDRAILS;
  const examISO = input.examDate;
  const days: CapacityDay[] = [];
  let dayISO = toISO(input.asOf);

  // Hard stop so a malformed exam date can never loop forever.
  for (let guard = 0; guard < 3650; guard++) {
    const daysUntilExam = daysBetween(dayISO, examISO);
    // Reached the protected buffer window (or the exam itself) — stop.
    if (daysUntilExam <= g.minBufferDays) break;

    const dow = dowOf(dayISO);
    const dayAvail = input.profile.days.find((x) => x.dayOfWeek === dow);
    let headroom = 0;
    if (dayAvail && dayAvail.available && dayAvail.windows.length > 0) {
      const candidateTarget = dayAvail.windows.reduce(
        (sum, w) => sum + w.targetSessionMinutes,
        0,
      );
      const cappedTarget = Math.min(candidateTarget, g.maxDailyMinutes);
      const alreadyPlanned = input.sessions
        .filter(
          (s) =>
            s.date === dayISO &&
            s.status === "planned" &&
            s.source === "plan",
        )
        .reduce((sum, s) => sum + s.plannedMinutes, 0);
      headroom = Math.max(0, cappedTarget - alreadyPlanned);
    }
    days.push({ dateISO: dayISO, dow, weekKey: weekKeyOf(dayISO), headroomMinutes: headroom });
    dayISO = addDays(dayISO, 1);
  }
  return days;
}

function makeSession(dateISO: string, dow: DayOfWeek, minutes: number): PlannedSession {
  return {
    id: `rb-${dateISO}`,
    date: dateISO,
    dayOfWeek: dow,
    windowId: null,
    topicIds: [],
    plannedMinutes: minutes,
    actualMinutes: null,
    status: "planned",
    source: "plan",
  };
}

// ---------- §6.3 place the deficit forward, earliest-first ----------
/**
 * Greedily fill `loadMinutes` into future headroom in date order, respecting
 * every guardrail: per-day cap (headroom), per-week cap, the consecutive-day
 * rest rule, and `minSessionMinutes` (no fragments). Returns what was placed and
 * any minutes that could NOT be placed — the raw signal for the infeasible branch.
 */
function placeForward(
  loadMinutes: number,
  days: CapacityDay[],
  g: Guardrails,
): { placed: PlannedSession[]; remaining: number } {
  const placed: PlannedSession[] = [];
  const weekTotals: Record<string, number> = {};
  const maxWeekly = g.maxWeeklyHours * 60;
  let remaining = loadMinutes;
  let consecutive = 0;

  for (const day of days) {
    if (remaining <= 0) break;

    // Consecutive-day rest rule: after MAX_CONSECUTIVE_DAYS studied in a row,
    // this day is a forced rest — place nothing and reset the run.
    if (consecutive >= g.maxConsecutiveDays) {
      consecutive = 0;
      continue;
    }
    if (day.headroomMinutes <= 0) {
      consecutive = 0; // unavailable/full day is a natural rest
      continue;
    }
    const weekUsed = weekTotals[day.weekKey] ?? 0;
    const weekRoom = Math.max(0, maxWeekly - weekUsed);
    if (weekRoom <= 0) {
      consecutive = 0;
      continue;
    }
    const place = Math.min(remaining, day.headroomMinutes, weekRoom);
    // Don't create sub-threshold fragments — unless this is the final block
    // needed to finish the load (remaining < minSession is a legitimate close-out).
    if (place < g.minSessionMinutes && remaining >= g.minSessionMinutes) {
      consecutive = 0;
      continue;
    }
    placed.push(makeSession(day.dateISO, day.dow, place));
    remaining -= place;
    weekTotals[day.weekKey] = weekUsed + place;
    consecutive += 1;
  }
  return { placed, remaining: Math.max(0, Math.round(remaining)) };
}

/** Total minutes that CAN be placed before the exam within all guardrails. */
export function computeCapacity(input: RebalanceInput, guardrails?: Guardrails): number {
  const g = guardrails ?? input.profile.guardrails ?? DEFAULT_GUARDRAILS;
  const { placed } = placeForward(Number.POSITIVE_INFINITY, buildCapacityDays(input, g), g);
  return placed.reduce((sum, s) => sum + s.plannedMinutes, 0);
}

// ---------- §6.5 feasibility grade ----------
function gradeFor(load: number, capacity: number): FeasibilityGrade {
  if (load <= 0) return "on-track";
  if (capacity <= 0 || load > capacity) return "at-risk";
  return load / capacity > 0.7 ? "tight" : "on-track";
}

function fmtHours(minutes: number): string {
  const h = minutes / 60;
  return Number.isInteger(h) ? `${h}` : h.toFixed(1);
}

// ---------- §6.6 branch ----------
/**
 * Place a SPECIFIC load (used directly by resolutions such as scope-cut). Returns
 * a propose-and-confirm `rebalanced` result, or a first-class `infeasible` event
 * with the honest options — never a silently over-stacked plan.
 */
export function rebalanceForLoad(
  input: RebalanceInput,
  loadMinutes: number,
  bankedSurplusMinutes = 0,
): RebalanceResult {
  const g = input.profile.guardrails ?? DEFAULT_GUARDRAILS;
  const days = buildCapacityDays(input, g);
  const capacity = placeForward(Number.POSITIVE_INFINITY, days, g).placed.reduce(
    (sum, s) => sum + s.plannedMinutes,
    0,
  );

  if (loadMinutes <= 0) {
    return {
      kind: "rebalanced",
      sessions: [],
      grade: "on-track",
      pacingNudge:
        bankedSurplusMinutes > 0
          ? `You're ${fmtHours(bankedSurplusMinutes)}h ahead — that buffer is banked toward your review window.`
          : null,
      surplusMinutes: bankedSurplusMinutes,
    };
  }

  const { placed, remaining } = placeForward(loadMinutes, days, g);

  if (remaining > 0) {
    // Feasibility guardrail: the deficit does NOT fit — do not overfill.
    return {
      kind: "infeasible",
      unplaceableMinutes: remaining,
      // At-risk always offers to move the exam date (locked decision), first.
      options: ["extend-exam-window", "reduce-scope", "raise-capacity", "accept-gap"],
      grade: "at-risk",
      message: `You're ${fmtHours(remaining)}h behind and your plan can't absorb it within a healthy pace.`,
    };
  }

  const grade = gradeFor(loadMinutes, capacity);
  const pacingNudge =
    grade === "tight"
      ? "This packs your remaining days near your ceiling — consider widening a window or adding a day."
      : bankedSurplusMinutes > 0
        ? `You're ${fmtHours(bankedSurplusMinutes)}h ahead — nice work.`
        : null;

  return { kind: "rebalanced", sessions: placed, grade, pacingNudge, surplusMinutes: bankedSurplusMinutes };
}

/**
 * Main entry point (spec §6). Computes the net delta from logged sessions, lets
 * surplus reduce the deficit (and bank buffer), then proposes a plan change or
 * raises a first-class infeasibility event.
 */
export function rebalance(input: RebalanceInput): RebalanceResult {
  const { deficitMinutes, surplusMinutes } = computeNetDelta(input.sessions);
  const netDeficit = Math.max(0, deficitMinutes - surplusMinutes);
  const bankedSurplus = Math.max(0, surplusMinutes - deficitMinutes);
  return rebalanceForLoad(input, netDeficit, bankedSurplus);
}
