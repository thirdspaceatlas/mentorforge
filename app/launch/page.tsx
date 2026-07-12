import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/access";

/**
 * /launch — the PWA start_url. Sends the installed app to the right place:
 *   - Subscribers (all_access / level_pass) -> /app/today (Calendar Coach)
 *   - Everyone else (incl. signed-out)       -> /app
 *
 * Kept server-side + dynamic so the redirect reflects the live plan on every
 * cold launch of the installed app.
 */
export const dynamic = "force-dynamic";

export default async function LaunchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let target = "/app";
  if (user) {
    try {
      const plan = await getUserPlan(user.id);
      if (plan.plan === "all_access" || plan.plan === "level_pass") {
        target = "/app/today";
      }
    } catch {
      // Fall back to /app if the plan lookup fails — never block the launch.
    }
  }

  redirect(target);
}
