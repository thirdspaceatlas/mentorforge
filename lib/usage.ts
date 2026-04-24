import { prisma } from "@/lib/prisma";
import type { PlanKind } from "@/lib/access";

/**
 * Phase 1b — rolling-7-day usage metering.
 *
 * Keys off the existing tables rather than a per-week counter row (design doc Option B):
 *   - Calendar connections: count rows in CalendarConnection where enabled = true.
 *   - Rebalances: count rows in UsageEvent where action = "rebalance" in the last 7 days.
 *   - Nudges: count rows in UsageEvent where action = "nudge_sent" in the last 7 days.
 *
 * Caps come from getCapsForPlan — free tier is the persona's cap surface; All Access is unlimited.
 */

export type CapAction = "add_calendar" | "rebalance" | "nudge_sent";

export type PlanCaps = {
  /** Simultaneously-enabled calendar connections. */
  calendars: number | null;
  /** Rolling-7-day rebalance cap. */
  rebalancesPerWeek: number | null;
  /** Rolling-7-day outgoing nudge cap. */
  nudgesPerWeek: number | null;
};

const FREE_CAPS: PlanCaps = {
  calendars: 1,
  rebalancesPerWeek: 1,
  nudgesPerWeek: 3
};

const UNLIMITED: PlanCaps = {
  calendars: null,
  rebalancesPerWeek: null,
  nudgesPerWeek: null
};

export function getCapsForPlan(plan: PlanKind): PlanCaps {
  if (plan === "all_access" || plan === "level_pass") return UNLIMITED;
  return FREE_CAPS;
}

function weekAgo(): Date {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
}

/** Returns the next Sunday 00:00 UTC — used as the "resets on" hint in UI copy. */
export function nextWeeklyReset(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setUTCHours(0, 0, 0, 0);
  const daysUntilSunday = (7 - d.getUTCDay()) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilSunday);
  return d;
}

export async function countUsageLast7Days(
  userId: string,
  action: Exclude<CapAction, "add_calendar">
): Promise<number> {
  return prisma.usageEvent.count({
    where: { userId, action, createdAt: { gte: weekAgo() } }
  });
}

export async function countEnabledCalendars(userId: string): Promise<number> {
  return prisma.calendarConnection.count({
    where: { userId, enabled: true }
  });
}

export async function recordUsage(
  userId: string,
  action: Exclude<CapAction, "add_calendar">
): Promise<void> {
  await prisma.usageEvent.create({ data: { userId, action } });
}

export type UsageSnapshot = {
  plan: PlanKind;
  calendars: { used: number; cap: number | null };
  rebalances: { used: number; cap: number | null; resetsAt: string };
  nudges: { used: number; cap: number | null; resetsAt: string };
};

/** Serializable usage snapshot for the dashboard / cap-hit UI. */
export async function getUsageSnapshot(
  userId: string,
  plan: PlanKind
): Promise<UsageSnapshot> {
  const caps = getCapsForPlan(plan);
  const [calCount, rebalCount, nudgeCount] = await Promise.all([
    countEnabledCalendars(userId),
    countUsageLast7Days(userId, "rebalance"),
    countUsageLast7Days(userId, "nudge_sent")
  ]);
  const resetsAt = nextWeeklyReset().toISOString();
  return {
    plan,
    calendars: { used: calCount, cap: caps.calendars },
    rebalances: { used: rebalCount, cap: caps.rebalancesPerWeek, resetsAt },
    nudges: { used: nudgeCount, cap: caps.nudgesPerWeek, resetsAt }
  };
}

export type CapCheck =
  | { allowed: true }
  | { allowed: false; action: CapAction; used: number; cap: number; resetsAt?: string };

export async function canUseFeature(
  userId: string,
  plan: PlanKind,
  action: CapAction
): Promise<CapCheck> {
  const caps = getCapsForPlan(plan);

  if (action === "add_calendar") {
    const cap = caps.calendars;
    if (cap == null) return { allowed: true };
    const used = await countEnabledCalendars(userId);
    if (used < cap) return { allowed: true };
    return { allowed: false, action, used, cap };
  }

  const cap = action === "rebalance" ? caps.rebalancesPerWeek : caps.nudgesPerWeek;
  if (cap == null) return { allowed: true };
  const used = await countUsageLast7Days(userId, action);
  if (used < cap) return { allowed: true };
  return {
    allowed: false,
    action,
    used,
    cap,
    resetsAt: nextWeeklyReset().toISOString()
  };
}
