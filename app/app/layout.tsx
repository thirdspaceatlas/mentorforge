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
      {/* Viewport-escape: break out of the global <main>'s max-w-[1200px] +
          px/py padding so the editorial cream surface fills the entire app
          frame edge-to-edge. */}
      <div className="relative left-1/2 -my-8 -ml-[50vw] w-screen bg-paper sm:-my-14">
        <div className="mx-auto flex min-h-[calc(100vh-3.65rem)] max-w-[1200px] sm:min-h-[calc(100vh-4rem)]">
          <AppSidebar />
          <div className="min-w-0 flex-1 px-4 py-8 sm:px-8 sm:py-14">
            {children}
          </div>
        </div>
      </div>
    </PlanProvider>
  );
}
