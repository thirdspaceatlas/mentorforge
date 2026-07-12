import { prisma } from "@/lib/prisma";
import type { RebalanceResult } from "./types";
import type { ResolutionOutcome } from "./resolutions";

/**
 * Persistence for FORGE-3 infeasibility events (spec §7: "persist and re-surface").
 * Thin wrappers over Prisma so the engine/API stay DB-agnostic and testable.
 */

export async function persistInfeasibilityEvent(
  userId: string,
  result: Extract<RebalanceResult, { kind: "infeasible" }>,
  context?: Record<string, unknown>,
): Promise<string> {
  const row = await prisma.infeasibilityEvent.create({
    data: {
      userId,
      unplaceableMinutes: result.unplaceableMinutes,
      message: result.message,
      optionsOffered: result.options.join(","),
      grade: result.grade,
      context: context ? (context as object) : undefined,
    },
  });
  return row.id;
}

export async function recordResolution(
  eventId: string,
  userId: string,
  outcome: ResolutionOutcome,
) {
  // Scope the update to the owner so one user can't resolve another's event.
  const existing = await prisma.infeasibilityEvent.findFirst({
    where: { id: eventId, userId },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.infeasibilityEvent.update({
    where: { id: eventId },
    data: {
      resolutionKind: outcome.kind,
      resolutionImpact: outcome.impact as object,
      resolvedFeasible: Boolean(outcome.impact.nowFeasible),
      resolvedAt: new Date(),
    },
  });
}

/**
 * Record just the CHOSEN resolution kind (propose-and-confirm) without a full
 * server-side recompute \u2014 used by the dashboard banner. The detailed recompute +
 * apply happens in the plan-generation flow.
 */
export async function recordResolutionChoice(
  eventId: string,
  userId: string,
  kind: string,
) {
  const existing = await prisma.infeasibilityEvent.findFirst({
    where: { id: eventId, userId },
    select: { id: true },
  });
  if (!existing) return null;
  return prisma.infeasibilityEvent.update({
    where: { id: eventId },
    data: { resolutionKind: kind, resolvedAt: new Date() },
  });
}

export async function listInfeasibilityEvents(userId: string) {  return prisma.infeasibilityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** The most recent event the candidate hasn't yet resolved — drives the dashboard card. */
export async function latestUnresolvedEvent(userId: string) {
  return prisma.infeasibilityEvent.findFirst({
    where: { userId, resolutionKind: null },
    orderBy: { createdAt: "desc" },
  });
}
