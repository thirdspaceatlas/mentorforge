import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rebalance } from "@/lib/plan/rebalance/engine";
import {
  extendExamWindow,
  raiseCapacity,
  reduceScope,
  type ScopeTopic,
} from "@/lib/plan/rebalance/resolutions";
import {
  persistInfeasibilityEvent,
  recordResolution,
  recordResolutionChoice,
  listInfeasibilityEvents,
} from "@/lib/plan/rebalance/persistence";
import { sendInfeasibilityEmail } from "@/lib/email/infeasibility-email";
import {
  buildRebalanceInput,
  scopeTopicsForLevel,
  DEFAULT_SCOPE_DROP,
  type SavedPlanLike,
} from "@/lib/plan/rebalance/from-saved-plan";
import { prisma } from "@/lib/prisma";
import type { RebalanceInput } from "@/lib/plan/rebalance/types";

/**
 * FORGE-3 rebalancing + infeasibility API (propose-and-confirm).
 *
 *  GET   → the caller's infeasibility-event history.
 *  POST  → run the engine over the caller's saved plan (or an explicit
 *          RebalanceInput); if the deficit can't be absorbed, persist a
 *          first-class infeasibility event and return it (never overfill).
 *  PATCH → apply a chosen resolution (extend exam / raise capacity / cut scope),
 *          recompute a fresh plan from the saved plan, and record the resolution.
 */

/** Rehydrate a JSON payload into a RebalanceInput (asOf string → Date). */
function toInput(raw: unknown): RebalanceInput {
  const r = raw as Record<string, unknown>;
  return {
    examDate: String(r.examDate),
    targetMinutes: Number(r.targetMinutes),
    profile: r.profile as RebalanceInput["profile"],
    sessions: (r.sessions as RebalanceInput["sessions"]) ?? [],
    asOf: r.asOf ? new Date(String(r.asOf)) : new Date(),
  };
}

/** Reconstruct the engine input from the signed-in user's saved study plan. */
async function loadInputForUser(userId: string): Promise<RebalanceInput | null> {
  const saved = await prisma.savedStudyPlan.findUnique({ where: { userId } });
  if (!saved) return null;
  return buildRebalanceInput(saved as unknown as SavedPlanLike, new Date());
}

function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const events = await listInfeasibilityEvents(user.id);
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Prefer an explicit input (has a profile); otherwise reconstruct from the
  // caller's saved study plan so the engine runs on real progress data.
  let input: RebalanceInput | null = null;
  try {
    const raw = await req.json().catch(() => null);
    if (raw && typeof raw === "object" && "profile" in raw) {
      input = toInput(raw);
    }
  } catch {
    /* fall through to saved-plan reconstruction */
  }
  if (!input) input = await loadInputForUser(user.id);
  if (!input) {
    return NextResponse.json({ error: "No study plan found" }, { status: 400 });
  }

  const result = rebalance(input);

  if (result.kind === "infeasible") {
    const eventId = await persistInfeasibilityEvent(user.id, result, {
      examDate: input.examDate,
      targetMinutes: input.targetMinutes,
    });

    // Best-effort, consent-aware at-risk email (never blocks/failsthe response).
    let email: Awaited<ReturnType<typeof sendInfeasibilityEmail>> = { sent: false };
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { email: true, firstName: true, emailCommunicationsOptIn: true },
      });
      const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mentorforge.co";
      email = await sendInfeasibilityEmail({
        to: profile?.email ?? user.email,
        optedIn: profile?.emailCommunicationsOptIn ?? false,
        eventId,
        data: {
          firstName: profile?.firstName,
          unplaceableMinutes: result.unplaceableMinutes,
          message: result.message,
          examDate: input.examDate,
          dashboardUrl: `${base}/app`,
        },
      });
    } catch {
      email = { sent: false, error: "email-failed" };
    }

    return NextResponse.json({ result, eventId, email });
  }
  return NextResponse.json({ result });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const eventId = String(body.eventId ?? "");
  const resolution = String(body.resolution ?? "");
  const validKinds = ["extend-exam-window", "raise-capacity", "reduce-scope", "accept-gap"];
  if (!validKinds.includes(resolution)) {
    return NextResponse.json({ error: "Unknown resolution" }, { status: 400 });
  }

  // Reconstruct the engine input: explicit body.input if given, else the saved plan.
  const input =
    body.input && typeof body.input === "object"
      ? toInput(body.input)
      : await loadInputForUser(user.id);

  if (resolution === "accept-gap" || !input) {
    // Nothing to recompute — just record the chosen resolution.
    if (eventId) await recordResolutionChoice(eventId, user.id, resolution);
    return NextResponse.json({ recorded: true, resolution });
  }

  let outcome;
  switch (resolution) {
    case "extend-exam-window":
      // Default: push to roughly the next sitting (~16 weeks) if none supplied.
      outcome = extendExamWindow(
        input,
        body.newExamDate ? String(body.newExamDate) : addDaysISO(input.examDate, 16 * 7),
      );
      break;
    case "raise-capacity":
      outcome = raiseCapacity(input, {
        dailyTargetMinutes: body.dailyTargetMinutes
          ? Number(body.dailyTargetMinutes)
          : undefined,
      });
      break;
    case "reduce-scope":
      outcome = reduceScope(
        input,
        (body.topics as ScopeTopic[]) ?? scopeTopicsForLevel(),
        (body.dropTopicIds as string[]) ?? DEFAULT_SCOPE_DROP,
      );
      break;
    default:
      return NextResponse.json({ error: "Unknown resolution" }, { status: 400 });
  }

  if (eventId) await recordResolution(eventId, user.id, outcome);
  return NextResponse.json({ outcome });
}
