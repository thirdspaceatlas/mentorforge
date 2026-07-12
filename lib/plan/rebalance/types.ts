/**
 * Domain types for the adaptive rebalancing engine — FORGE-6.
 *
 * Mirrors docs/forge-3-rebalancing-spec.md. Pure and DB-agnostic: the
 * Prisma/persistence layer is deliberately separate, and must be reconciled with
 * the EXISTING Calendar Coach models, which are distinct concepts despite similar
 * names:
 *   - `StudyWindow`  = a *detected* calendar gap (regenerated on sync)
 *   - `StudySession` = a *started* timer (execution layer)
 * The types below are the *planning/availability* layer: what the user configures
 * and what the engine plans, before anything is executed.
 */

/** Minutes past local midnight, 0–1440. */
export type MinuteOfDay = number;

/** 0 = Sunday … 6 = Saturday (matches the existing SessionPattern.dayOfWeek). */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * A user-configured availability window — a SEARCH RANGE the coach places a
 * session *within*, not the session itself (spec §4). Must be ≥ `minWindowMinutes`
 * wide so the coach has slack to place/move the block. Distinct from `StudyWindow`.
 */
export type AvailabilityWindow = {
  start: MinuteOfDay;
  end: MinuteOfDay;
  /** Target study-block length to place inside this window (the candidate's target). */
  targetSessionMinutes: number;
};

export type DayAvailability = {
  dayOfWeek: DayOfWeek;
  available: boolean;
  /** ≥1 window; ≥2 supported (morning + evening, lunch + twilight). */
  windows: AvailabilityWindow[];
};

/**
 * Protective pacing rails (spec §4 + FORGE-3 build-ready constants). The daily and
 * weekly values are HARD CAPS above the candidate's onboarding target; buffer and
 * consecutive-day rails protect the review window and force rest.
 */
export type Guardrails = {
  /** No single day's planned load exceeds this (hard cap = MAX_HOURS_PER_DAY). */
  maxDailyMinutes: number;
  /** Weekly pacing ceiling (hard cap = MAX_HOURS_PER_WEEK). */
  maxWeeklyHours: number;
  /** Floor for a study BLOCK — no sub-threshold fragments. */
  minSessionMinutes: number;
  /** Floor for a WINDOW width so the coach can place/move within it. */
  minWindowMinutes: number;
  /** Max consecutive study days before a rest day is forced (MAX_CONSECUTIVE_DAYS). */
  maxConsecutiveDays: number;
  /** Review/mock buffer before the exam — no new content scheduled here (MIN_BUFFER_DAYS). */
  minBufferDays: number;
};

export type AvailabilityProfile = {
  userId: string;
  days: DayAvailability[];
  guardrails: Guardrails;
};

export type SessionStatus = "planned" | "done" | "partial" | "missed";

/** `off-hours` = effort logged after the fact, outside the plan (spec §8). */
export type SessionSource = "plan" | "off-hours";

/**
 * The atomic planning unit (spec §4). Distinct from the execution-layer
 * `StudySession`: a PlannedSession may never be started.
 */
export type PlannedSession = {
  id: string;
  /** ISO date, e.g. "2026-11-15". */
  date: string;
  dayOfWeek: DayOfWeek;
  /** Availability window this block sits in; null for off-hours logs. */
  windowId: string | null;
  topicIds: string[];
  plannedMinutes: number;
  actualMinutes: number | null;
  status: SessionStatus;
  source: SessionSource;
};

export type FeasibilityGrade = "on-track" | "tight" | "at-risk";

/** Net delta across logged sessions (spec §6.1). */
export type NetDelta = {
  deficitMinutes: number;
  surplusMinutes: number;
};

export type RebalanceInput = {
  /** ISO date. */
  examDate: string;
  /** Target study minutes for the level (e.g. L1 = 300h → 18000). */
  targetMinutes: number;
  profile: AvailabilityProfile;
  sessions: PlannedSession[];
  /** "Now", injected for testability. */
  asOf: Date;
};

/** Options offered when the deficit can't fit before the exam (spec §7). */
export type InfeasibleOption =
  | "extend-exam-window"
  | "raise-capacity"
  | "reduce-scope"
  | "accept-gap";

export type RebalanceResult =
  | {
      kind: "rebalanced";
      sessions: PlannedSession[];
      grade: FeasibilityGrade;
      /** Set when load nears a guardrail ceiling — surface a kind pacing nudge. */
      pacingNudge: string | null;
      /** Buffer gained from surplus / off-hours effort (spec §6.4). */
      surplusMinutes: number;
    }
  | {
      kind: "infeasible";
      /** Minutes that cannot be placed before the exam within guardrails. */
      unplaceableMinutes: number;
      options: InfeasibleOption[];
      grade: FeasibilityGrade;
      /** Honest headline for the infeasibility event (spec §7). */
      message: string;
    };
