import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, canUseFeature, recordUsage } from "@/lib/access";

/**
 * POST /api/study-plan/rebalance — Phase 1b freemium cap gate for smart rebalancing.
 *
 * The rebalance math itself still runs client-side (app/app/page.tsx). The client calls
 * this endpoint *before* applying the rebalance to confirm the user is under their
 * weekly cap. On success, a UsageEvent is recorded so subsequent calls count against
 * the same rolling-7-day window.
 *
 * Responses:
 *   200 { ok: true, used, cap, resetsAt } — proceed.
 *   402 { error: "cap_exceeded", used, cap, resetsAt } — show cap-hit UX client-side.
 *   401 { error: "Unauthorized" } — session invalid.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userPlan = await getUserPlan(user.id);
  const capCheck = await canUseFeature(user.id, userPlan.plan, "rebalance");

  if (!capCheck.allowed) {
    return NextResponse.json(
      {
        error: "cap_exceeded",
        used: capCheck.used,
        cap: capCheck.cap,
        resetsAt: capCheck.resetsAt
      },
      { status: 402 }
    );
  }

  await recordUsage(user.id, "rebalance");

  return NextResponse.json({ ok: true });
}
