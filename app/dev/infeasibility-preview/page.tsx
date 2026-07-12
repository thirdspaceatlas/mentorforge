import { notFound } from "next/navigation";
import { InfeasibilityPreviewClient } from "./preview-client";

/**
 * Dev-only preview of the FORGE-3 rebalancing UX (infeasibility card +
 * review-&-confirm). Runs the pure engine client-side — no auth, no DB.
 * 404s in production builds.
 */
export default function InfeasibilityPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <InfeasibilityPreviewClient />;
}
