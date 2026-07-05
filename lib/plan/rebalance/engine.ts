import type {
  NetDelta,
  PlannedSession,
  RebalanceInput,
  RebalanceResult,
} from "./types";

/**
 * Adaptive rebalancing engine — FORGE-6 skeleton.
 *
 * Implements the structure of docs/forge-3-rebalancing-spec.md §6. The stable,
 * order-independent helper (net delta) is implemented; placement, feasibility,
 * and the infeasible branch are stubbed until the spec LOCKS (post-FORGE-2
 * validation), because their behavior depends on open questions in spec §10.
 */

/**
 * §6.1 — Compute net delta from logged sessions. Shortfalls accrue to
 * `deficitMinutes`; overages (including `off-hours` source) accrue to
 * `surplusMinutes`. Surplus is never discarded (spec principle #5: reward
 * getting ahead). Unlogged sessions (`actualMinutes == null`) are ignored.
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

/**
 * Main entry point. Full algorithm in spec §6:
 *   1. computeNetDelta                                          [implemented]
 *   2. identify open future capacity (per-day/window headroom, guardrail-capped)
 *   3. place the deficit forward, earliest-first, respecting window targets,
 *      minSessionMinutes, maxDailyMinutes, maxWeeklyHours
 *   4. apply surplus → reduce remaining required load, surface buffer
 *   5. re-feasibility check (promote buildSummary's ratio into a real gate)
 *   6. branch → fits | approaches-ceiling (pacingNudge) | infeasible (§7)
 *
 * Gating open questions (spec §10): auto-redistribute vs. propose-and-confirm;
 * daily vs. weekly ceiling; default ordering of InfeasibleOption.
 */
export function rebalance(_input: RebalanceInput): RebalanceResult {
  // TODO(FORGE-6): implement steps 2–6 once the spec locks (post-FORGE-2).
  throw new Error(
    "rebalance(): not implemented — skeleton only. See docs/forge-3-rebalancing-spec.md §6.",
  );
}
