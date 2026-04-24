import { prisma } from "@/lib/prisma";

export type PlanKind = "free" | "level_pass" | "all_access";

// Phase 1b — usage-metering surface. The lib/usage.ts module holds the counting / cap
// logic; re-exporting here keeps one import site for server-side access checks.
export {
  canUseFeature,
  countEnabledCalendars,
  countUsageLast7Days,
  getCapsForPlan,
  getUsageSnapshot,
  nextWeeklyReset,
  recordUsage
} from "@/lib/usage";
export type { CapAction, CapCheck, PlanCaps, UsageSnapshot } from "@/lib/usage";

export type UserPlan = {
  plan: PlanKind;
  accessExpiresAt: Date | null;
  /** CFA level for Level Pass; All Access has all levels; Free is Level I only for gating. */
  levelUnlocked: "I" | "II" | "III" | null;
};

export type GatedFeature =
  | "smart_rebalancing"
  | "progress_tracking"
  | "ethics_spacing"
  | "calendar_view"
  | "level_II"
  | "level_III";

/**
 * Resolves effective plan from paid purchases. All Access beats Level Pass.
 * Expired Level Pass → treated as free (Level I limited).
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const now = new Date();

  const purchases = await prisma.purchase.findMany({
    where: { userId, status: "paid" },
    orderBy: { createdAt: "desc" }
  });

  const activeAllAccess = purchases.find((p) => {
    if (p.planKey !== "all_access") return false;
    if (p.accessExpiresAt == null) return true;
    return p.accessExpiresAt > now;
  });
  if (activeAllAccess) {
    return {
      plan: "all_access",
      accessExpiresAt: activeAllAccess.accessExpiresAt,
      levelUnlocked: null
    };
  }

  const activeLevelPass = purchases.find(
    (p) =>
      p.planKey === "level_pass" &&
      p.accessExpiresAt != null &&
      p.accessExpiresAt > now
  );
  if (activeLevelPass) {
    const lvl = activeLevelPass.levelUnlocked as "I" | "II" | "III" | null;
    return {
      plan: "level_pass",
      accessExpiresAt: activeLevelPass.accessExpiresAt,
      levelUnlocked: lvl ?? "I"
    };
  }

  return {
    plan: "free",
    accessExpiresAt: null,
    levelUnlocked: "I"
  };
}

export async function hasAccess(userId: string, feature: GatedFeature): Promise<boolean> {
  const u = await getUserPlan(userId);

  switch (feature) {
    // Phase 1a (2026-04-24): unified product — these features are available to all plans.
    // Phase 1b will reintroduce gating as weekly usage caps rather than feature locks.
    case "smart_rebalancing":
    case "progress_tracking":
    case "ethics_spacing":
    case "calendar_view":
      return true;
    case "level_II":
    case "level_III":
      return u.plan === "all_access";
    default:
      return false;
  }
}

/** Serializable plan for client context (dates as ISO strings). */
export type UserPlanSerialized = {
  plan: PlanKind;
  accessExpiresAt: string | null;
  levelUnlocked: "I" | "II" | "III" | null;
};

export function serializeUserPlan(p: UserPlan): UserPlanSerialized {
  return {
    plan: p.plan,
    accessExpiresAt: p.accessExpiresAt?.toISOString() ?? null,
    levelUnlocked: p.levelUnlocked
  };
}

/** Client-safe feature check using serialized plan from `PlanProvider` (mirrors `hasAccess` rules). */
export function hasFeatureForPlan(plan: UserPlanSerialized, feature: GatedFeature): boolean {
  const now = new Date();
  const exp = plan.accessExpiresAt ? new Date(plan.accessExpiresAt) : null;

  const allAccessActive =
    plan.plan === "all_access" && (exp == null || exp > now);

  switch (feature) {
    // Phase 1a (2026-04-24): unified product — available to all plans (caps come in Phase 1b).
    case "smart_rebalancing":
    case "progress_tracking":
    case "ethics_spacing":
    case "calendar_view":
      return true;
    case "level_II":
    case "level_III":
      return allAccessActive;
    default:
      return false;
  }
}
