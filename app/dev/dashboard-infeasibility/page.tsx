import { notFound } from "next/navigation";
import { DashboardInfeasibilityClient } from "./preview-client";

/**
 * Dev-only: shows the infeasibility card WIRED into a Calendar Coach dashboard
 * shell (same container/chrome the real dashboard injects it into), driven by
 * the pure engine. No auth, no DB. 404s in production.
 */
export default function DashboardInfeasibilityPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DashboardInfeasibilityClient />;
}
