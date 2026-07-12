import type { Guardrails } from "./types";

/**
 * FORGE-3 protective guardrail constants (build-ready, 2026).
 *
 * These are NAMED CONSTANTS with a candidate-set override (see `resolveGuardrails`),
 * NOT universal hardcoded values. Design rule: a candidate sets their own
 * weekday/weekend capacity target at onboarding; the constant is the HARD CAP
 * *above* that target — never the target itself. The engine will place load up to
 * the candidate's target and treat the constant as the absolute ceiling it must
 * never breach (no cramming to "make it fit").
 */

/** Sustainable ceiling on any single day. 6h breaks the candidate. */
export const MAX_HOURS_PER_DAY = 4;
/** Weekly pacing ceiling: 1–2h weekdays + heavier weekends. */
export const MAX_HOURS_PER_WEEK = 20;
/** Review/mock window before the exam — no NEW content scheduled into it. */
export const MIN_BUFFER_DAYS = 14;
/** Forces at least one rest day; prevents burnout abandonment. */
export const MAX_CONSECUTIVE_DAYS = 6;

/** Don't schedule sub-threshold study blocks. */
export const DEFAULT_MIN_SESSION_MINUTES = 25;
/** A window must be ≥ 2h so the coach has slack to place/move a session in it. */
export const DEFAULT_MIN_WINDOW_MINUTES = 120;

/**
 * Default protective rails, derived from the named constants above. The hard
 * caps here are the ceilings; a candidate's onboarding target lives in their
 * AvailabilityProfile windows and sits *under* these.
 */
export const DEFAULT_GUARDRAILS: Guardrails = {
  maxDailyMinutes: MAX_HOURS_PER_DAY * 60, // 240
  maxWeeklyHours: MAX_HOURS_PER_WEEK, // 20
  minSessionMinutes: DEFAULT_MIN_SESSION_MINUTES,
  minWindowMinutes: DEFAULT_MIN_WINDOW_MINUTES,
  maxConsecutiveDays: MAX_CONSECUTIVE_DAYS,
  minBufferDays: MIN_BUFFER_DAYS,
};

/**
 * Candidate-override logic. A candidate may TIGHTEN any rail (a smaller personal
 * ceiling than the constant), but may never LOOSEN it past the protective
 * constant — the constant is the hard cap above the candidate's target. This is
 * why guardrails are named constants with an override, not universal hardcoded
 * values: the override can only make the plan safer, never more punishing.
 */
export function resolveGuardrails(overrides?: Partial<Guardrails>): Guardrails {
  const merged: Guardrails = { ...DEFAULT_GUARDRAILS, ...(overrides ?? {}) };
  return {
    ...merged,
    // Clamp to the protective ceilings — a candidate can only go lower.
    maxDailyMinutes: Math.min(merged.maxDailyMinutes, MAX_HOURS_PER_DAY * 60),
    maxWeeklyHours: Math.min(merged.maxWeeklyHours, MAX_HOURS_PER_WEEK),
    // The buffer/rest rails are floors of protection — enforce at least the constant.
    minBufferDays: Math.max(merged.minBufferDays, MIN_BUFFER_DAYS),
    maxConsecutiveDays: Math.min(merged.maxConsecutiveDays, MAX_CONSECUTIVE_DAYS),
  };
}
