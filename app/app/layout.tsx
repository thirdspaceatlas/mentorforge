import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, serializeUserPlan } from "@/lib/access";
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

  const plan = await getUserPlan(user.id);
  const serialized = serializeUserPlan(plan);

  return <PlanProvider value={serialized}>{children}</PlanProvider>;
}
