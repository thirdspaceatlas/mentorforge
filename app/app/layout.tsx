import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, serializeUserPlan } from "@/lib/access";
import type { UserPlan } from "@/lib/access";
import { PlanProvider } from "@/components/app/PlanProvider";
import { AppSidebar } from "@/components/app/AppSidebar";

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
    console.error("Failed to load user plan:", err instanceof Error ? err.message : "unknown");
    plan = { plan: "free", accessExpiresAt: null, levelUnlocked: null };
  }

  const serialized = serializeUserPlan(plan);

  return (
    <PlanProvider value={serialized}>
      <div className="flex min-h-[calc(100vh-3.65rem)] sm:min-h-[calc(100vh-4rem)]">
        <AppSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </PlanProvider>
  );
}
