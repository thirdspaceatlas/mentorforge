import { notFound } from "next/navigation";
import { DashboardPreviewClient } from "./preview-client";

/**
 * Dev-only preview route. 404s in production builds so the seeded mock data
 * isn't reachable on the public site.
 */
export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DashboardPreviewClient />;
}
