import type { MetadataRoute } from "next";

/**
 * Web App Manifest (PWA). Served at /manifest.webmanifest.
 *
 * start_url points at /launch, a tiny server route that redirects based on the
 * user's plan (subscribers -> Calendar Coach /app/today, everyone else -> /app).
 * A static manifest can't branch per-user, so the routing lives in /launch.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MentorForge — CFA Study Planner",
    short_name: "MentorForge",
    description: "Plan, pace, and rebalance your CFA study path.",
    id: "/",
    start_url: "/launch",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f4",
    theme_color: "#0f1f4a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
