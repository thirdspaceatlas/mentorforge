import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getUsageSnapshot } from "@/lib/access";

/**
 * GET /api/usage — returns the signed-in user's rolling-7-day usage snapshot
 * (calendars / rebalances / nudges) and their plan. Used by /app/account and
 * future cap-aware UI surfaces.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userPlan = await getUserPlan(user.id);
  const snapshot = await getUsageSnapshot(user.id, userPlan.plan);

  return NextResponse.json(snapshot);
}
