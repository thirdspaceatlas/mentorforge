/**
 * Plausible custom event tracking. Centralizes event names and bucketing so
 * typos don't silently split data and bucket thresholds don't drift.
 *
 * All Plausible property values must be strings. Booleans render as "true"/"false".
 * Numeric values are bucketed to keep cardinality low (keeps dashboards usable).
 */

export const Events = {
  signup: "signup",
  onboardingComplete: "onboarding_complete",
  planGenerated: "plan_generated",
  calendarConnected: "calendar_connected",
  sessionCompleted: "session_completed",
  upgradeClicked: "upgrade_clicked",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

export function track(event: EventName, props: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  window.plausible?.(event, { props });
}

export function bucketHoursPerWeek(h: number): string {
  if (h <= 5) return "1-5";
  if (h <= 10) return "6-10";
  if (h <= 15) return "11-15";
  return "16+";
}

export function bucketDaysToExam(days: number): string {
  if (days < 30) return "<30";
  if (days < 90) return "30-90";
  if (days < 180) return "90-180";
  return "180+";
}

export function bucketWeekCount(n: number): string {
  if (n <= 12) return "1-12";
  if (n <= 26) return "13-26";
  return "27-52";
}

export function bucketSessionMinutes(m: number): string {
  if (m < 30) return "<30";
  if (m < 60) return "30-60";
  if (m < 120) return "60-120";
  return "120+";
}

export function referrerSource(): string {
  if (typeof document === "undefined") return "direct";
  const ref = document.referrer;
  if (!ref) return "direct";
  try {
    const host = new URL(ref).hostname.toLowerCase();
    if (host.includes("linkedin")) return "linkedin";
    if (host.includes("reddit")) return "reddit";
    if (host.includes("google") || host.includes("bing") || host.includes("duckduckgo")) return "search";
    return "other";
  } catch {
    return "other";
  }
}
