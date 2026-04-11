/**
 * Serialization utilities for study plan persistence.
 * Handles Date <-> ISO string conversion for WeekPlan arrays.
 */

/** Wire format — dates as ISO strings for JSON/DB storage */
export type WeekPlanSerialized = {
  week: number;
  topic: string;
  plannedHours: number;
  startDate: string;
  endDate: string;
  startDateLabel: string;
  endDateLabel: string;
  daysInWeek: number;
  rebalancedExtraHours: number;
};

/** Payload shape for the /api/study-plan endpoint */
export type SavedStudyPlanPayload = {
  examLevel: string;
  examDate: string;
  weeklyHours: number;
  planStartDate: string;
  weekStartDay: string;
  levelIIIPathway: string | null;
  forecastDays?: number;
  weekPlan: WeekPlanSerialized[];
  baseWeekPlan: WeekPlanSerialized[];
  actualHours: (number | null)[];
};

/** Convert ISO date string to local midnight Date (no timezone drift) */
function toLocalMidnight(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Convert Date to ISO date string "YYYY-MM-DD" */
function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type WeekPlan = {
  week: number;
  topic: string;
  plannedHours: number;
  startDate: Date;
  endDate: Date;
  startDateLabel: string;
  endDateLabel: string;
  daysInWeek: number;
  rebalancedExtraHours: number;
};

export function serializeWeekPlan(plan: WeekPlan[]): WeekPlanSerialized[] {
  return plan.map((w) => ({
    ...w,
    startDate: toISO(w.startDate),
    endDate: toISO(w.endDate),
  }));
}

export function deserializeWeekPlan(data: WeekPlanSerialized[]): WeekPlan[] {
  return data.map((w) => ({
    ...w,
    startDate: toLocalMidnight(w.startDate),
    endDate: toLocalMidnight(w.endDate),
  }));
}
