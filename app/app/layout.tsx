import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, serializeUserPlan } from "@/lib/access";
import type { UserPlan } from "@/lib/access";
import { PlanProvider } from "@/components/app/PlanProvider";

/**
 * /app is available to any logged-in user (free tier + paid). Middleware enforces auth only.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/app");
  }

  let plan: UserPlan;
  try {
    plan = await getUserPlan(user.id);
  } catch (err) {
    // Log the real error server-side, never expose connection strings to the client
    console.error("Failed to load user plan:", err instanceof Error ? err.message : "unknown");
    plan = { plan: "free", accessExpiresAt: null, levelUnlocked: null };
  }

  const serialized = serializeUserPlan(plan);

  return <PlanProvider value={serialized}>{children}</PlanProvider>;
}
